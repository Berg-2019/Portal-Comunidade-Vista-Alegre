import { useState, useRef } from 'react';
import { Upload, FileText, X, Check, Loader2, AlertCircle, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api } from '@/services/api';

interface ExtractedPackage {
  recipient_name: string;
  tracking_code: string;
  arrival_date: string;
  selected: boolean;
}

interface AdminPackagePDFUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: () => void;
}

export function AdminPackagePDFUpload({ open, onOpenChange, onImportSuccess }: AdminPackagePDFUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [extractedPackages, setExtractedPackages] = useState<ExtractedPackage[]>([]);
  const [pdfFilename, setPdfFilename] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione um arquivo PDF.',
        variant: 'destructive',
      });
      return;
    }

    setFile(selectedFile);
    await uploadAndExtract(selectedFile);
  };

  const uploadAndExtract = async (pdfFile: File) => {
    setUploading(true);
    setExtractedPackages([]);

    try {
      const formData = new FormData();
      formData.append('pdf', pdfFile);

      const result = await api.uploadPackagePdf(formData);

      if (result.success && result.results) {
        const packagesWithSelection = result.results.packages.map((pkg: any) => ({
          ...pkg,
          selected: true,
        }));
        setExtractedPackages(packagesWithSelection);
        setPdfFilename(result.results.filename || pdfFile.name);

        if (packagesWithSelection.length === 0) {
          toast({
            title: 'Nenhuma encomenda encontrada',
            description: 'Não foi possível extrair encomendas do PDF. Verifique o formato do arquivo.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'PDF processado',
            description: `${packagesWithSelection.length} encomendas extraídas. Revise e confirme a importação.`,
          });
        }
      }
    } catch (error: any) {
      console.error('Erro ao processar PDF:', error);
      toast({
        title: 'Erro ao processar PDF',
        description: error.message || 'Não foi possível processar o arquivo.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmImport = async () => {
    const selectedPackages = extractedPackages.filter(pkg => pkg.selected);
    
    if (selectedPackages.length === 0) {
      toast({
        title: 'Nenhuma encomenda selecionada',
        description: 'Selecione ao menos uma encomenda para importar.',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);

    try {
      const response = await api.confirmPackageImport(selectedPackages, pdfFilename);
      
      toast({
        title: 'Importação concluída',
        description: `${response.imported} encomendas importadas. ${response.duplicates} duplicadas ignoradas.`,
      });

      handleClose();
      onImportSuccess();
    } catch (error: any) {
      console.error('Erro ao importar:', error);
      toast({
        title: 'Erro na importação',
        description: error.message || 'Não foi possível importar as encomendas.',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const togglePackageSelection = (index: number) => {
    setExtractedPackages(prev =>
      prev.map((pkg, i) => (i === index ? { ...pkg, selected: !pkg.selected } : pkg))
    );
  };

  const toggleAllSelection = () => {
    const allSelected = extractedPackages.every(pkg => pkg.selected);
    setExtractedPackages(prev => prev.map(pkg => ({ ...pkg, selected: !allSelected })));
  };

  const removePackage = (index: number) => {
    setExtractedPackages(prev => prev.filter((_, i) => i !== index));
  };

  const updatePackage = (index: number, field: keyof ExtractedPackage, value: string) => {
    setExtractedPackages(prev =>
      prev.map((pkg, i) => (i === index ? { ...pkg, [field]: value } : pkg))
    );
  };

  const handleClose = () => {
    setFile(null);
    setExtractedPackages([]);
    setPdfFilename('');
    setEditingIndex(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onOpenChange(false);
  };

  const selectedCount = extractedPackages.filter(pkg => pkg.selected).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Importar Encomendas do PDF
          </DialogTitle>
          <DialogDescription>
            Faça upload de um PDF com a lista de encomendas. O sistema tentará extrair automaticamente os dados.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {/* Upload Area */}
          {extractedPackages.length === 0 && (
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                uploading ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />

              {uploading ? (
                <div className="space-y-3">
                  <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Processando PDF...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <Button onClick={() => fileInputRef.current?.click()}>
                      Selecionar PDF
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    ou arraste e solte o arquivo aqui
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Extracted Packages Preview */}
          {extractedPackages.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-success" />
                  <span className="font-medium">
                    {extractedPackages.length} encomendas extraídas
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({selectedCount} selecionadas)
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={toggleAllSelection}>
                    {extractedPackages.every(pkg => pkg.selected) ? 'Desmarcar todas' : 'Selecionar todas'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setExtractedPackages([]);
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    Novo Upload
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={extractedPackages.every(pkg => pkg.selected)}
                          onChange={toggleAllSelection}
                          className="rounded"
                        />
                      </TableHead>
                      <TableHead>Destinatário</TableHead>
                      <TableHead>Código de Rastreio</TableHead>
                      <TableHead>Data de Chegada</TableHead>
                      <TableHead className="w-24">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {extractedPackages.map((pkg, index) => (
                      <TableRow key={index} className={!pkg.selected ? 'opacity-50' : ''}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={pkg.selected}
                            onChange={() => togglePackageSelection(index)}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell>
                          {editingIndex === index ? (
                            <Input
                              value={pkg.recipient_name}
                              onChange={(e) => updatePackage(index, 'recipient_name', e.target.value)}
                              className="h-8"
                            />
                          ) : (
                            <span className="font-medium">{pkg.recipient_name}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingIndex === index ? (
                            <Input
                              value={pkg.tracking_code}
                              onChange={(e) => updatePackage(index, 'tracking_code', e.target.value)}
                              className="h-8 font-mono"
                            />
                          ) : (
                            <code className="text-sm bg-muted px-2 py-1 rounded">{pkg.tracking_code}</code>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingIndex === index ? (
                            <Input
                              type="date"
                              value={pkg.arrival_date}
                              onChange={(e) => updatePackage(index, 'arrival_date', e.target.value)}
                              className="h-8"
                            />
                          ) : (
                            pkg.arrival_date ? new Date(pkg.arrival_date).toLocaleDateString('pt-BR') : '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => removePackage(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {extractedPackages.some(pkg => !pkg.tracking_code || !pkg.recipient_name) && (
                <div className="flex items-start gap-2 p-3 bg-warning/10 rounded-lg text-sm">
                  <AlertCircle className="h-4 w-4 text-warning mt-0.5" />
                  <div>
                    <p className="font-medium text-warning">Atenção</p>
                    <p className="text-muted-foreground">
                      Algumas encomendas possuem dados incompletos. Revise antes de importar.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={importing}>
            Cancelar
          </Button>
          {extractedPackages.length > 0 && (
            <Button onClick={handleConfirmImport} disabled={importing || selectedCount === 0}>
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Importar {selectedCount} encomendas
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}