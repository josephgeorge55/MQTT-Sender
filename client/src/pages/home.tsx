import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { mqttMessageSchema, type MqttMessage, type MessageLogEntry, type ConnectionStatus } from "@shared/schema";
import { 
  Radio, 
  Send, 
  Wifi, 
  WifiOff, 
  Loader2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Trash2,
  Power,
  PowerOff
} from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [messageLog, setMessageLog] = useState<MessageLogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const form = useForm<MqttMessage>({
    resolver: zodResolver(mqttMessageSchema),
    defaultValues: {
      topic: "",
      message: "",
    },
  });

  // Fetch MQTT connection status
  const { data: statusData, refetch: refetchStatus } = useQuery<{ 
    status: ConnectionStatus; 
    broker: string; 
    username?: string;
    error?: string;
  }>({
    queryKey: ['/api/mqtt/status'],
    refetchInterval: 3000,
  });

  const connectionStatus = statusData?.status || 'disconnected';
  const brokerAddress = statusData?.broker || '';
  const mqttUsername = statusData?.username || '';
  const connectionError = statusData?.error || '';

  // Connect mutation
  const connectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/mqtt/connect');
      return res.json();
    },
    onSuccess: () => {
      refetchStatus();
      toast({
        title: "Connecting",
        description: "Attempting to connect to MQTT broker...",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/mqtt/disconnect');
      return res.json();
    },
    onSuccess: () => {
      refetchStatus();
      toast({
        title: "Disconnected",
        description: "MQTT connection closed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Disconnect Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (data: MqttMessage) => {
      const res = await apiRequest('POST', '/api/mqtt/send', data);
      return res.json();
    },
    onSuccess: (result, variables) => {
      const entry: MessageLogEntry = {
        id: crypto.randomUUID(),
        topic: variables.topic,
        message: variables.message,
        timestamp: new Date(),
        status: 'sent',
      };
      setMessageLog(prev => [entry, ...prev]);
      form.reset({ topic: form.getValues('topic'), message: '' });
      toast({
        title: "Message Sent",
        description: `Published to ${variables.topic}`,
      });
    },
    onError: (error: Error, variables) => {
      const entry: MessageLogEntry = {
        id: crypto.randomUUID(),
        topic: variables.topic,
        message: variables.message,
        timestamp: new Date(),
        status: 'error',
      };
      setMessageLog(prev => [entry, ...prev]);
      toast({
        title: "Send Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MqttMessage) => {
    sendMutation.mutate(data);
  };

  const clearLog = () => {
    setMessageLog([]);
  };

  const getStatusColor = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return 'bg-emerald-500';
      case 'connecting':
        return 'bg-amber-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-muted-foreground';
    }
  };

  const getStatusIcon = (status: ConnectionStatus) => {
    switch (status) {
      case 'connected':
        return <Wifi className="h-4 w-4" />;
      case 'connecting':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'error':
        return <WifiOff className="h-4 w-4" />;
      default:
        return <WifiOff className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-lg bg-primary/10">
            <Radio className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">MQTT Sender</h1>
            <p className="text-muted-foreground">Emulate outboard hardware messaging</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Connection Status Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between gap-2 flex-wrap">
                <span>Connection Status</span>
                <Badge 
                  variant="outline" 
                  className="font-normal flex items-center gap-1.5"
                >
                  <span className={`w-2 h-2 rounded-full ${getStatusColor(connectionStatus)}`} />
                  {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-md bg-muted/50 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Broker:</span>
                  <code className="font-mono text-xs bg-background px-2 py-0.5 rounded">
                    {brokerAddress || 'Not configured'}
                  </code>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">User:</span>
                  <code className="font-mono text-xs bg-background px-2 py-0.5 rounded">
                    {mqttUsername || 'Not set'}
                  </code>
                </div>
                {connectionError && (
                  <div className="text-sm text-red-500 bg-red-500/10 px-2 py-1 rounded">
                    {connectionError}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => connectMutation.mutate()}
                  disabled={connectionStatus === 'connected' || connectMutation.isPending}
                  className="flex-1"
                  data-testid="button-connect"
                >
                  {connectMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Power className="h-4 w-4 mr-2" />
                  )}
                  Connect
                </Button>
                <Button
                  variant="outline"
                  onClick={() => disconnectMutation.mutate()}
                  disabled={connectionStatus === 'disconnected' || disconnectMutation.isPending}
                  className="flex-1"
                  data-testid="button-disconnect"
                >
                  {disconnectMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <PowerOff className="h-4 w-4 mr-2" />
                  )}
                  Disconnect
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Send Message Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Send Message</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topic</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., device/sensors/temperature" 
                            {...field}
                            data-testid="input-topic"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder='{"value": 23.5, "unit": "celsius"}'
                            className="resize-none font-mono text-sm min-h-[100px]"
                            {...field}
                            data-testid="input-message"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={connectionStatus !== 'connected' || sendMutation.isPending}
                    data-testid="button-send"
                  >
                    {sendMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Send MQTT Message
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Message Log */}
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="text-lg">Message Log</CardTitle>
              {messageLog.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearLog}
                  className="text-muted-foreground"
                  data-testid="button-clear-log"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {messageLog.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Radio className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No messages sent yet</p>
                <p className="text-sm">Messages you send will appear here</p>
              </div>
            ) : (
              <ScrollArea className="h-[300px]" ref={scrollRef}>
                <div className="space-y-3">
                  {messageLog.map((entry) => (
                    <div 
                      key={entry.id} 
                      className="p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          {entry.status === 'sent' ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                          )}
                          <code className="font-mono text-sm bg-muted px-2 py-0.5 rounded">
                            {entry.topic}
                          </code>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {entry.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                      <pre className="text-sm font-mono bg-muted/50 p-2 rounded overflow-x-auto whitespace-pre-wrap break-all">
                        {entry.message}
                      </pre>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
