import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, FileJson, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ExportExpense {
  amount: number;
  description: string | null;
  transaction_date: string;
  category_name: string;
  category_id: string;
  tags: string[] | null;
  paid_by: string | null;
}

export const ImportExport = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [importFormat, setImportFormat] = useState<'json' | 'csv'>('json');
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<ExportExpense[] | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; skipped: number } | null>(null);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('expense_categories')
      .select('id, name');
    return data || [];
  };

  // ─── EXPORT ───────────────────────────────────────────────
  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      const { data, error } = await supabase
        .from('expense_transactions')
        .select(`
          amount, description, transaction_date, category_id, tags, paid_by,
          expense_categories ( name )
        `)
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false });

      if (error) throw error;

      const rows: ExportExpense[] = (data || []).map((r: any) => ({
        amount: r.amount,
        description: r.description,
        transaction_date: r.transaction_date,
        category_name: r.expense_categories?.name || '',
        category_id: r.category_id,
        tags: r.tags,
        paid_by: r.paid_by,
      }));

      let blob: Blob;
      let filename: string;

      if (exportFormat === 'json') {
        blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
        filename = `expenses_${new Date().toISOString().slice(0, 10)}.json`;
      } else {
        const header = 'amount,description,transaction_date,category_name,category_id,tags,paid_by';
        const csvRows = rows.map(r =>
          [
            r.amount,
            csvEscape(r.description || ''),
            r.transaction_date,
            csvEscape(r.category_name),
            r.category_id,
            csvEscape((r.tags || []).join(';')),
            csvEscape(r.paid_by || ''),
          ].join(',')
        );
        blob = new Blob([header + '\n' + csvRows.join('\n')], { type: 'text/csv' });
        filename = `expenses_${new Date().toISOString().slice(0, 10)}.csv`;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: 'Exported', description: `${rows.length} expenses exported as ${exportFormat.toUpperCase()}` });
    } catch (err) {
      console.error('Export error:', err);
      toast({ title: 'Export failed', description: 'Could not export expenses', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  // ─── IMPORT ───────────────────────────────────────────────
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      let parsed: ExportExpense[];

      if (importFormat === 'json') {
        parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) throw new Error('JSON must be an array');
      } else {
        parsed = parseCsv(text);
      }

      // Validate required fields
      const valid = parsed.filter(
        r => r.amount != null && !isNaN(Number(r.amount)) && r.transaction_date
      );

      if (valid.length === 0) {
        toast({ title: 'No valid rows', description: 'File contains no importable rows', variant: 'destructive' });
        return;
      }

      setImportPreview(valid);
      setShowConfirm(true);
    } catch (err: any) {
      console.error('Parse error:', err);
      toast({ title: 'Parse failed', description: err.message || 'Could not parse file', variant: 'destructive' });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const confirmImport = async () => {
    if (!user || !importPreview) return;
    setShowConfirm(false);
    setImporting(true);

    try {
      const categories = await fetchCategories();
      const catMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));

      // Fetch existing transactions for duplicate detection (using amount + date + description only)
      const { data: existingData } = await supabase
        .from('expense_transactions')
        .select('amount, description, transaction_date')
        .eq('user_id', user.id);

      const existingSet = new Set(
        (existingData || []).map(e =>
          `${e.amount}|${e.transaction_date}|${(e.description || '').toLowerCase().trim()}`
        )
      );

      let success = 0;
      let failed = 0;
      let skipped = 0;

      const batchSize = 50;
      for (let i = 0; i < importPreview.length; i += batchSize) {
        const batch = importPreview.slice(i, i + batchSize);
        const rows = batch.map(r => {
          let resolvedCategoryId = r.category_id;
          if (!resolvedCategoryId && r.category_name) {
            resolvedCategoryId = catMap.get(r.category_name.toLowerCase()) || '';
          }
          if (!resolvedCategoryId && categories.length > 0) {
            resolvedCategoryId = categories[0].id;
          }
          return {
            amount: Number(r.amount),
            description: r.description || null,
            transaction_date: r.transaction_date,
            category_id: resolvedCategoryId,
            tags: r.tags || null,
            paid_by: r.paid_by || null,
            user_id: user.id,
          };
        }).filter(r => r.category_id);

        // Filter out duplicates using amount + date + description
        const newRows = rows.filter(r => {
          const key = `${r.amount}|${r.transaction_date}|${(r.description || '').toLowerCase().trim()}`;
          if (existingSet.has(key)) return false;
          existingSet.add(key);
          return true;
        });

        skipped += rows.length - newRows.length;

        if (newRows.length > 0) {
          const { error } = await supabase.from('expense_transactions').insert(newRows);
          if (error) {
            console.error('Batch insert error:', error);
            failed += newRows.length;
          } else {
            success += newRows.length;
          }
        } else if (rows.length === 0) {
          failed += batch.length;
        }
      }

      setImportResult({ success, failed, skipped });
      toast({
        title: 'Import complete',
        description: `${success} imported, ${skipped} duplicates skipped, ${failed} failed`,
        variant: failed > 0 ? 'destructive' : 'default',
      });
    } catch (err) {
      console.error('Import error:', err);
      toast({ title: 'Import failed', description: 'An error occurred during import', variant: 'destructive' });
    } finally {
      setImporting(false);
      setImportPreview(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Import / Export</h2>
        <p className="text-muted-foreground">Export your expenses or import data from a file</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Export Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export Expenses
            </CardTitle>
            <CardDescription>Download all your expense data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={exportFormat} onValueChange={(v: 'json' | 'csv') => setExportFormat(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2"><FileJson className="w-4 h-4" /> JSON</div>
                  </SelectItem>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" /> CSV</div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleExport} disabled={exporting} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              {exporting ? 'Exporting...' : 'Export'}
            </Button>
          </CardContent>
        </Card>

        {/* Import Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Import Expenses
            </CardTitle>
            <CardDescription>Upload a JSON or CSV file to add expenses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={importFormat} onValueChange={(v: 'json' | 'csv') => setImportFormat(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2"><FileJson className="w-4 h-4" /> JSON</div>
                  </SelectItem>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2"><FileSpreadsheet className="w-4 h-4" /> CSV</div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={importFormat === 'json' ? '.json' : '.csv'}
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              variant="outline"
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              {importing ? 'Importing...' : 'Choose File & Import'}
            </Button>

            {importResult && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-sm">
                {importResult.failed === 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-destructive" />
                )}
                <span>{importResult.success} imported, {importResult.skipped} duplicates skipped, {importResult.failed} failed</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expected format info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Expected File Format</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>The file should contain the following fields per expense:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {['amount (required)', 'transaction_date (required)', 'description', 'category_name', 'category_id', 'tags', 'paid_by'].map(f => (
              <code key={f} className="bg-muted px-2 py-1 rounded text-xs">{f}</code>
            ))}
          </div>
          <p className="text-xs">
            <strong>Tip:</strong> Export your data first to see the exact format, add new rows, then import the file back.
          </p>
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Import</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to import <strong>{importPreview?.length || 0}</strong> expense records.
              They will be added to your account. This action cannot be undone easily.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImport}>Import</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// ─── Helpers ──────────────────────────────────────────────

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function parseCsv(text: string): ExportExpense[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase());

  return lines.slice(1).map(line => {
    const values = parseCsvLine(line);
    const row: any = {};
    headers.forEach((h, i) => {
      row[h] = values[i]?.trim() || '';
    });

    return {
      amount: Number(row.amount),
      description: row.description || null,
      transaction_date: row.transaction_date || '',
      category_name: row.category_name || '',
      category_id: row.category_id || '',
      tags: row.tags ? row.tags.split(';').filter(Boolean) : null,
      paid_by: row.paid_by || null,
    };
  });
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}
