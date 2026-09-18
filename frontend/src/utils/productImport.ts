import type { BulkProductInput, Category, ProductImportError } from '../types';
import type { ParseResult } from 'papaparse';

type SpreadsheetRow = Record<string, unknown>;

export type ProductImportPreview = {
  products: BulkProductInput[];
  errors: ProductImportError[];
};

const aliases: Record<string, string[]> = {
  name: ['name', 'productname', 'product'],
  description: ['description', 'productdescription'],
  price: ['price', 'pricethb'],
  stock: ['stock', 'stockunits', 'quantity'],
  category: ['category', 'categoryname'],
  categoryId: ['categoryid'],
  imageUrl: ['imageurl', 'image', 'imageaddress'],
  department: ['department', 'eligibledepartment'],
  discountPct: ['discountpct', 'discountpercent', 'discountpercentage', 'discount'],
};

function normalizeHeader(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/[^a-z0-9]/g, '');
}

function getCell(row: SpreadsheetRow, field: keyof typeof aliases): unknown {
  const entry = Object.entries(row).find(([header]) =>
    aliases[field].includes(normalizeHeader(header))
  );
  return entry?.[1];
}

function asText(value: unknown): string {
  return value === undefined || value === null ? '' : String(value).trim();
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const text = asText(value).replace(/,/g, '');
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function parseProductImportFile(
  file: File,
  categories: Category[]
): Promise<ProductImportPreview> {
  let rows: SpreadsheetRow[];
  if (file.name.toLocaleLowerCase().endsWith('.csv')) {
    const Papa = (await import('papaparse')).default;
    const parsed = await new Promise<ParseResult<SpreadsheetRow>>((resolve, reject) => {
      Papa.parse<SpreadsheetRow>(file, {
        header: true,
        skipEmptyLines: 'greedy',
        complete: resolve,
        error: reject,
      });
    });
    if (parsed.errors.length > 0) {
      throw new Error(parsed.errors[0].message);
    }
    rows = parsed.data;
  } else {
    const readXlsxFile = (await import('read-excel-file')).default;
    const sheetRows = await readXlsxFile(file);
    const [headerRow = [], ...dataRows] = sheetRows;
    const headers = headerRow.map((header) => asText(header));
    rows = dataRows
      .filter((row) => row.some((cell) => asText(cell) !== ''))
      .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])));
  }
  const categoriesById = new Map(categories.map((category) => [category.id, category]));
  const categoriesByName = new Map(
    categories.map((category) => [category.name.trim().toLocaleLowerCase(), category])
  );
  const errors: ProductImportError[] = [];
  const products: BulkProductInput[] = [];

  if (rows.length === 0) {
    return { products, errors: [{ row: 1, field: 'file', message: 'The file has no product rows' }] };
  }
  if (rows.length > 500) {
    errors.push({ row: 1, field: 'file', message: 'A single import can contain at most 500 products' });
  }

  rows.slice(0, 500).forEach((source, index) => {
    const row = index + 2;
    const name = asText(getCell(source, 'name'));
    const description = asText(getCell(source, 'description'));
    const price = asNumber(getCell(source, 'price'));
    const stock = asNumber(getCell(source, 'stock'));
    const discountValue = getCell(source, 'discountPct');
    const discountPct = asText(discountValue) === '' ? 0 : asNumber(discountValue);
    const categoryName = asText(getCell(source, 'category'));
    const categoryIdValue = getCell(source, 'categoryId');
    const categoryId = asNumber(categoryIdValue);
    const category =
      (categoryId !== null ? categoriesById.get(categoryId) : undefined) ||
      (categoryName ? categoriesByName.get(categoryName.toLocaleLowerCase()) : undefined);
    const imageUrl = asText(getCell(source, 'imageUrl'));
    const department = asText(getCell(source, 'department'));

    if (!name) errors.push({ row, field: 'name', message: 'Product name is required' });
    if (name.length > 191) errors.push({ row, field: 'name', message: 'Product name must be 191 characters or fewer' });
    if (price === null || price < 0) errors.push({ row, field: 'price', message: 'Enter a non-negative price' });
    if (stock === null || !Number.isSafeInteger(stock) || stock < 0) {
      errors.push({ row, field: 'stock', message: 'Enter a non-negative whole number' });
    }
    if (!category) errors.push({ row, field: 'category', message: 'Use an existing category name or ID' });
    if (discountPct === null || discountPct < 0 || discountPct > 100) {
      errors.push({ row, field: 'discountPct', message: 'Discount must be between 0 and 100' });
    }
    if (imageUrl.length > 191) errors.push({ row, field: 'imageUrl', message: 'Image URL must be 191 characters or fewer' });
    if (department.length > 191) errors.push({ row, field: 'department', message: 'Department must be 191 characters or fewer' });

    products.push({
      row,
      name,
      description,
      price: price ?? 0,
      stock: stock ?? 0,
      categoryId: category?.id ?? 0,
      category: category?.name ?? categoryName,
      imageUrl,
      department,
      discountPct: discountPct ?? 0,
    });
  });

  return { products, errors };
}

export async function downloadProductImportTemplate(categories: Category[]): Promise<void> {
  const Papa = (await import('papaparse')).default;
  const categoryName = categories[0]?.name || 'Apparel & Clothing';
  const csv = Papa.unparse([
    {
      name: 'University Classic T-Shirt',
      description: 'Soft cotton university T-shirt for everyday campus wear.',
      price: 450,
      stock: 40,
      category: categoryName,
      imageUrl: '',
      department: '',
      discountPct: 0,
    },
  ]);
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'product-import-template.csv';
  link.click();
  URL.revokeObjectURL(url);
}
