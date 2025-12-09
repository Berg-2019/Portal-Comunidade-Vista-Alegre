import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { botApi, BotStatus, BotMetrics } from '@/services/botApi';
import { 
  MessageCircle, 
  Power, 
  PowerOff, 
  QrCode, 
  RefreshCw, 
  Activity,
  Clock,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
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
  XCircle
} from 'lucide-react';

const BOT_API_URL = import.meta.env.VITE_BOT_API_URL || 'http://localhost:3002';

export function AdminBotManager() {
  const { toast } = useToast();
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [metrics, setMetrics] = useState<BotMetrics | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isApiReachable, setIsApiReachable] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      console.log('[Bot Debug] Tentando conectar em:', BOT_API_URL);
      
      const startTime = Date.now();
      
      // Health check first
      try {
        await botApi.healthCheck();
        setIsApiReachable(true);
        setApiError(null);
      } catch (healthError) {
        console.error('[Bot Debug] Health check falhou:', healthError);
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
          console.log('[Bot Debug] QR Code recebido');
        } catch (qrError) {
          console.error('[Bot Debug] Erro ao buscar QR Code:', qrError);
          setQrCode(null);
        }
      } else {
        setQrCode(null);
      }
    } catch (error) {
      console.error('[Bot Debug] Erro completo ao buscar status:', error);
      setStatus(null);
      setLatency(null);
      setIsApiReachable(false);
      setApiError(`Não foi possível conectar à API do Bot. Verifique se o serviço está rodando em ${BOT_API_URL}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await botApi.connect();
      toast({
        title: 'Conectando...',
        description: 'Aguarde o QR Code aparecer para escanear.',
      });
      // Wait a bit for QR to generate
      setTimeout(fetchStatus, 2000);
    } catch (error: any) {
      console.error('[Bot Debug] Erro ao conectar:', error);
      toast({
        title: 'Erro ao conectar',
        description: error.message || 'Não foi possível iniciar a conexão',
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
      fetchStatus();
    } catch (error: any) {
      console.error('[Bot Debug] Erro ao desconectar:', error);
      toast({
        title: 'Erro ao desconectar',
        description: error.message || 'Não foi possível desconectar',
        variant: 'destructive',
      });
    } finally {
      setDisconnecting(false);
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
                <p className="text-sm text-muted-foreground">
                  {apiError}
                </p>
                <div className="text-xs bg-muted p-2 rounded font-mono">
                  URL configurada: {BOT_API_URL}
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Verifique:</strong></p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Se o container <code className="bg-muted px-1 rounded">whatsapp-bot</code> está rodando</li>
                    <li>Se a variável <code className="bg-muted px-1 rounded">VITE_BOT_API_URL</code> está correta</li>
                    <li>Se há conectividade de rede entre o frontend e o bot</li>
                  </ul>
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

      {/* Status Cards - Only show if API is reachable */}
      {isApiReachable && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {status?.connected ? (
                      <Wifi className="h-5 w-5 text-green-500" />
                    ) : (
                      <WifiOff className="h-5 w-5 text-red-500" />
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
                    <Activity className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Latência</span>
                  </div>
                  <span className={`font-mono ${latency && latency > 500 ? 'text-yellow-500' : 'text-green-500'}`}>
                    {latency ? `${latency}ms` : '--'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-purple-500" />
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
                    <Phone className="h-5 w-5 text-emerald-500" />
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
                  <QrCode className="h-5 w-5" />
                  Conexão WhatsApp
                </CardTitle>
                <CardDescription>
                  Gerencie a conexão do bot com o WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* QR Code Display */}
                {qrCode && !status?.connected && (
                  <div className="flex flex-col items-center p-4 bg-white rounded-lg border">
                    <p className="text-sm text-muted-foreground mb-3">
                      Escaneie o QR Code com seu WhatsApp
                    </p>
                    <img 
                      src={qrCode} 
                      alt="QR Code" 
                      className="w-64 h-64 border rounded"
                    />
                    <p className="text-xs text-muted-foreground mt-3">
                      Abra o WhatsApp {'>'} Menu {'>'} Dispositivos conectados {'>'} Conectar um dispositivo
                    </p>
                  </div>
                )}

                {/* Connected State */}
                {status?.connected && (
                  <div className="flex flex-col items-center p-8 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                    <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">
                      Bot Conectado
                    </h3>
                    <p className="text-sm text-green-600 dark:text-green-500">
                      {status.phoneNumber ? `+${status.phoneNumber}` : 'WhatsApp ativo'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Última conexão: {formatDate(status.lastConnected)}
                    </p>
                  </div>
                )}

                {/* Disconnected State */}
                {!status?.connected && !qrCode && !status?.connecting && (
                  <div className="flex flex-col items-center p-8 bg-muted/50 rounded-lg border">
                    <WifiOff className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold">Bot Desconectado</h3>
                    <p className="text-sm text-muted-foreground">
                      Clique em conectar para iniciar
                    </p>
                  </div>
                )}

                {/* Connecting State */}
                {status?.connecting && !qrCode && (
                  <div className="flex flex-col items-center p-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <Loader2 className="h-16 w-16 text-blue-500 animate-spin mb-4" />
                    <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400">
                      Conectando...
                    </h3>
                    <p className="text-sm text-blue-600 dark:text-blue-500">
                      Aguarde o QR Code
                    </p>
                  </div>
                )}

                <Separator />

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {!status?.connected ? (
                    <Button 
                      onClick={handleConnect} 
                      disabled={connecting || status?.connecting}
                      className="flex-1"
                    >
                      {connecting || status?.connecting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Power className="h-4 w-4 mr-2" />
                      )}
                      Conectar
                    </Button>
                  ) : (
                    <Button 
                      variant="destructive" 
                      onClick={handleDisconnect}
                      disabled={disconnecting}
                      className="flex-1"
                    >
                      {disconnecting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <PowerOff className="h-4 w-4 mr-2" />
                      )}
                      Desconectar
                    </Button>
                  )}
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
                      <span className="text-sm">Tempo Médio</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {metrics?.averageResponseTime ? `${Math.round(metrics.averageResponseTime)}ms` : '--'}
                    </p>
                  </div>
                </div>

                {metrics && metrics.errors > 0 && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <span className="text-sm text-red-700 dark:text-red-400">
                      {metrics.errors} erro(s) registrado(s)
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bot Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Funcionalidades do Bot
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">Reserva de Quadras</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Usuários podem reservar horários nas quadras esportivas diretamente pelo WhatsApp.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">Reportar Ocorrências</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Moradores podem reportar problemas no distrito para triagem e publicação.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">Consultar Encomendas</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Consulta rápida de encomendas disponíveis para retirada no correio.
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