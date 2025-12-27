
import * as XLSX from 'xlsx';

export const exportToExcel = (data: any[], fileName: string, sheetName: string = 'Sheet1') => {
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Generate buffer
    XLSX.writeFile(wb, `${fileName}.xlsx`);
};

export const formatDataForExport = (data: any[], headers: Record<string, string>) => {
    return data.map(item => {
        const row: any = {};
        Object.entries(headers).forEach(([key, label]) => {
            // Handle nested properties or formatting if needed
            // Simple mapping for now
            row[label] = item[key];
        });
        return row;
    });
};
