import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { botApi, BotStatus, BotMetrics } from '@/services/botApi';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  MessageCircle, 
  Power, 
  PowerOff, 
  QrCode, 
  RefreshCw, 
  Activity,
  Clock,
  Loader2,
  Phone,
  Wifi,
  WifiOff,
  Calendar,
  BarChart3,
  Send,
  Inbox,
  Package,
  AlertCircle,
  XCircle,
  Trash2,
  CheckCircle2,
  Smartphone,
  Hash
} from 'lucide-react';

const BOT_API_URL = import.meta.env.VITE_BOT_API_URL || 'http://localhost:3002';

export function AdminBotManager() {
  const { toast } = useToast();
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [metrics, setMetrics] = useState<BotMetrics | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [clearingSession, setClearingSession] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isApiReachable, setIsApiReachable] = useState(true);
  const [connectionMethod, setConnectionMethod] = useState<'code' | 'qr'>('code');

  const fetchStatus = useCallback(async () => {
    try {
      const startTime = Date.now();
      
      try {
        await botApi.healthCheck();
        setIsApiReachable(true);
        setApiError(null);
      } catch (healthError) {
        setIsApiReachable(false);
        setApiError(`API do Bot não está acessível em ${BOT_API_URL}`);
        setLoading(false);
        return;
      }

      const [statusData, metricsData] = await Promise.all([
        botApi.getStatus(),
        botApi.getMetrics()
      ]);
      setLatency(Date.now() - startTime);
      setStatus(statusData);
      setMetrics(metricsData);

      // Fetch QR code if available
      if (statusData.qrAvailable) {
        try {
          const qrData = await botApi.getQRCode();
          setQrCode(qrData.qr);
        } catch {
          setQrCode(null);
        }
      } else {
        setQrCode(null);
      }

      // Fetch pairing code if connecting via pairing
      if (statusData.connecting && statusData.connectionMethod === 'pairing') {
        try {
          const pairingData = await botApi.getPairingCode();
          setPairingCode(pairingData.formatted);
        } catch {
          // Code not ready yet
        }
      } else if (!statusData.connecting) {
        setPairingCode(null);
      }
    } catch (error) {
      setStatus(null);
      setLatency(null);
      setIsApiReachable(false);
      setApiError(`Não foi possível conectar à API do Bot.`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleConnectWithQR = async () => {
    setConnecting(true);
    setPairingCode(null);
    try {
      await botApi.connect();
      toast({
        title: 'Conectando via QR Code...',
        description: 'Aguarde o QR Code aparecer para escanear.',
      });
      setTimeout(fetchStatus, 2000);
    } catch (error: any) {
      toast({
        title: 'Erro ao conectar',
        description: error.message || 'Não foi possível iniciar a conexão',
        variant: 'destructive',
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleConnectWithPairingCode = async () => {
    if (!phoneNumber || phoneNumber.replace(/\D/g, '').length < 10) {
      toast({
        title: 'Número inválido',
        description: 'Informe um número de telefone válido com DDD (ex: 5511999999999)',
        variant: 'destructive',
      });
      return;
    }

    setConnecting(true);
    setQrCode(null);
    setPairingCode(null);

    try {
      await botApi.connectWithPairingCode(phoneNumber.replace(/\D/g, ''));
      toast({
        title: 'Solicitando código...',
        description: 'Aguarde o código de pareamento.',
      });

      // Polling para obter o código
      let attempts = 0;
      const pollCode = setInterval(async () => {
        attempts++;
        try {
          const data = await botApi.getPairingCode();
          if (data.formatted) {
            setPairingCode(data.formatted);
            clearInterval(pollCode);
          }
        } catch {
          if (attempts > 15) {
            clearInterval(pollCode);
            toast({
              title: 'Timeout',
              description: 'Código não foi gerado. Tente novamente.',
              variant: 'destructive',
            });
          }
        }
      }, 1000);

    } catch (error: any) {
      toast({
        title: 'Erro ao solicitar código',
        description: error.message || 'Não foi possível gerar o código',
        variant: 'destructive',
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await botApi.disconnect();
      toast({
        title: 'Bot desconectado',
        description: 'A sessão do WhatsApp foi encerrada.',
      });
      setPairingCode(null);
      fetchStatus();
    } catch (error: any) {
      toast({
        title: 'Erro ao desconectar',
        description: error.message || 'Não foi possível desconectar',
        variant: 'destructive',
      });
    } finally {
      setDisconnecting(false);
    }
  };

  const handleClearSession = async () => {
    setClearingSession(true);
    try {
      await botApi.clearSession();
      toast({
        title: 'Sessão limpa',
        description: 'Escolha um método de conexão para gerar novo código.',
      });
      setPairingCode(null);
      setQrCode(null);
      fetchStatus();
    } catch (error: any) {
      toast({
        title: 'Erro ao limpar sessão',
        description: error.message || 'Não foi possível limpar a sessão',
        variant: 'destructive',
      });
    } finally {
      setClearingSession(false);
    }
  };

  const formatUptime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'Nunca';
    return new Date(dateStr).toLocaleString('pt-BR');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="h-6 w-6" />
            Gerenciamento do Bot WhatsApp
          </h2>
          <p className="text-muted-foreground">
            Controle a conexão e monitore o desempenho do bot
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStatus}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* API Connection Error Alert */}
      {!isApiReachable && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <XCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-semibold text-destructive">API do Bot Inacessível</h3>
                <p className="text-sm text-muted-foreground">{apiError}</p>
                <div className="text-xs bg-muted p-2 rounded font-mono">
                  URL configurada: {BOT_API_URL}
                </div>
                <Button variant="outline" size="sm" onClick={fetchStatus} className="mt-2">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tentar Novamente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Cards */}
      {isApiReachable && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {status?.connected ? (
                      <Wifi className="h-5 w-5 text-success" />
                    ) : (
                      <WifiOff className="h-5 w-5 text-destructive" />
                    )}
                    <span className="font-medium">Status</span>
                  </div>
                  <Badge variant={status?.connected ? 'default' : status?.connecting ? 'secondary' : 'destructive'}>
                    {status?.connected ? 'Online' : status?.connecting ? 'Conectando...' : 'Offline'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-info" />
                    <span className="font-medium">Latência</span>
                  </div>
                  <span className={`font-mono ${latency && latency > 500 ? 'text-warning' : 'text-success'}`}>
                    {latency ? `${latency}ms` : '--'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-accent" />
                    <span className="font-medium">Uptime</span>
                  </div>
                  <span className="font-mono">
                    {status?.uptime ? formatUptime(status.uptime) : '--'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-success" />
                    <span className="font-medium">Número</span>
                  </div>
                  <span className="font-mono text-sm">
                    {status?.phoneNumber ? `+${status.phoneNumber}` : '--'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Connection Control */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Conexão WhatsApp
                </CardTitle>
                <CardDescription>
                  Escolha o método de conexão preferido
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Connected State */}
                {status?.connected && (
                  <div className="flex flex-col items-center p-8 bg-success/10 rounded-lg border border-success/30">
                    <CheckCircle2 className="h-16 w-16 text-success mb-4" />
                    <h3 className="text-lg font-semibold text-success">
                      Bot Conectado
                    </h3>
                    <p className="text-sm text-success/80">
                      {status.phoneNumber ? `+${status.phoneNumber}` : 'WhatsApp ativo'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Última conexão: {formatDate(status.lastConnected)}
                    </p>
                  </div>
                )}

                {/* Connection Methods (only when disconnected) */}
                {!status?.connected && (
                  <Tabs value={connectionMethod} onValueChange={(v) => setConnectionMethod(v as 'code' | 'qr')}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="code" className="flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        Código
                      </TabsTrigger>
                      <TabsTrigger value="qr" className="flex items-center gap-2">
                        <QrCode className="h-4 w-4" />
                        QR Code
                      </TabsTrigger>
                    </TabsList>

                    {/* Pairing Code Tab */}
                    <TabsContent value="code" className="space-y-4 mt-4">
                      {!pairingCode && !status?.connecting && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="phone">Número do WhatsApp</Label>
                            <Input
                              id="phone"
                              placeholder="5511999999999"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              className="font-mono"
                            />
                            <p className="text-xs text-muted-foreground">
                              Informe o número com código do país e DDD
                            </p>
                          </div>
                          <Button 
                            onClick={handleConnectWithPairingCode} 
                            disabled={connecting}
                            className="w-full"
                          >
                            {connecting ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Hash className="h-4 w-4 mr-2" />
                            )}
                            Obter Código
                          </Button>
                        </div>
                      )}

                      {/* Pairing Code Display */}
                      {pairingCode && (
                        <div className="flex flex-col items-center p-6 bg-success/10 rounded-lg border border-success/30">
                          <p className="text-sm text-muted-foreground mb-2">
                            Digite este código no WhatsApp:
                          </p>
                          <p className="text-4xl font-mono font-bold text-success tracking-widest">
                            {pairingCode}
                          </p>
                          <div className="text-xs text-muted-foreground mt-4 text-center space-y-1">
                            <p>WhatsApp → <strong>Dispositivos Conectados</strong></p>
                            <p>→ Conectar Dispositivo → <strong>Usar código</strong></p>
                          </div>
                        </div>
                      )}

                      {/* Connecting State */}
                      {status?.connecting && !pairingCode && (
                        <div className="flex flex-col items-center p-8 bg-info/10 rounded-lg border border-info/30">
                          <Loader2 className="h-16 w-16 text-info animate-spin mb-4" />
                          <h3 className="text-lg font-semibold text-info">
                            Gerando código...
                          </h3>
                        </div>
                      )}
                    </TabsContent>

                    {/* QR Code Tab */}
                    <TabsContent value="qr" className="space-y-4 mt-4">
                      {!qrCode && !status?.connecting && (
                        <div className="flex flex-col items-center p-8 bg-muted/50 rounded-lg border">
                          <QrCode className="h-16 w-16 text-muted-foreground mb-4" />
                          <p className="text-sm text-muted-foreground mb-4">
                            Clique para gerar o QR Code
                          </p>
                          <Button 
                            onClick={handleConnectWithQR} 
                            disabled={connecting}
                          >
                            {connecting ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <QrCode className="h-4 w-4 mr-2" />
                            )}
                            Gerar QR Code
                          </Button>
                        </div>
                      )}

                      {/* QR Code Display */}
                      {qrCode && (
                        <div className="flex flex-col items-center p-4 bg-white rounded-lg border">
                          <p className="text-sm text-muted-foreground mb-3">
                            Escaneie o QR Code com seu WhatsApp
                          </p>
                          <img 
                            src={qrCode} 
                            alt="QR Code" 
                            className="w-64 h-64 border rounded"
                          />
                          <p className="text-xs text-muted-foreground mt-3 text-center">
                            WhatsApp → Menu → Dispositivos conectados → Conectar
                          </p>
                        </div>
                      )}

                      {/* Connecting State */}
                      {status?.connecting && !qrCode && (
                        <div className="flex flex-col items-center p-8 bg-info/10 rounded-lg border border-info/30">
                          <Loader2 className="h-16 w-16 text-info animate-spin mb-4" />
                          <h3 className="text-lg font-semibold text-info">
                            Gerando QR Code...
                          </h3>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                )}

                <Separator />

                {/* Action Buttons */}
                <div className="flex flex-col gap-3">
                  {status?.connected && (
                    <Button 
                      variant="destructive" 
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                      className="w-full"
                    >
                      {disconnecting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <PowerOff className="h-4 w-4 mr-2" />
                      )}
                      Desconectar
                    </Button>
                  )}

                  {/* Clear Session Button */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full border-warning/50 text-warning hover:bg-warning/10 hover:text-warning"
                        disabled={clearingSession}
                      >
                        {clearingSession ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        Limpar Sessão
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Limpar Sessão do WhatsApp?</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                          <p>Esta ação irá:</p>
                          <ul className="list-disc pl-4 space-y-1 text-sm">
                            <li>Desconectar o dispositivo atual</li>
                            <li>Apagar todas as credenciais salvas</li>
                            <li>Resetar as métricas do bot</li>
                            <li>Exigir nova conexão</li>
                          </ul>
                          <p className="text-warning font-medium mt-3">
                            Use se a conexão estiver com problemas ou para trocar de número.
                          </p>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearSession}>
                          Limpar Sessão
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>

            {/* Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Métricas do Bot
                </CardTitle>
                <CardDescription>
                  Estatísticas de uso e desempenho
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Inbox className="h-4 w-4" />
                      <span className="text-sm">Recebidas</span>
                    </div>
                    <p className="text-2xl font-bold">{metrics?.messagesReceived || 0}</p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Send className="h-4 w-4" />
                      <span className="text-sm">Enviadas</span>
                    </div>
                    <p className="text-2xl font-bold">{metrics?.messagesSent || 0}</p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">Reservas</span>
                    </div>
                    <p className="text-2xl font-bold">{metrics?.reservationsProcessed || 0}</p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">Ocorrências</span>
                    </div>
                    <p className="text-2xl font-bold">{metrics?.occurrencesProcessed || 0}</p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Package className="h-4 w-4" />
                      <span className="text-sm">Encomendas</span>
                    </div>
                    <p className="text-2xl font-bold">{metrics?.packagesQueried || 0}</p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Tempo médio</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {metrics?.averageResponseTime ? `${Math.round(metrics.averageResponseTime)}ms` : '--'}
                    </p>
                  </div>
                </div>

                {metrics?.errors && metrics.errors > 0 && (
                  <div className="mt-4 p-3 bg-destructive/10 rounded-lg border border-destructive/30">
                    <div className="flex items-center gap-2 text-destructive">
                      <XCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">{metrics.errors} erro(s) registrado(s)</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bot Features Info */}
          <Card>
            <CardHeader>
              <CardTitle>Funcionalidades do Bot</CardTitle>
              <CardDescription>
                O bot responde automaticamente às seguintes solicitações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Reserva de Quadras
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Usuários podem consultar horários e solicitar reservas de quadras esportivas
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-warning" />
                    Ocorrências
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Moradores podem registrar problemas e ocorrências do bairro
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <Package className="h-4 w-4 text-info" />
                    Encomendas
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Consulta de encomendas disponíveis para retirada na portaria
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
