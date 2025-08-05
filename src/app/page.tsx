
"use client";

import { useState, useEffect, useRef } from "react";
import { Copy, SendHorizonal, Bot, User, RotateCw, Network, ShieldCheck, ShieldX, TriangleAlert, LogIn, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { UMDProtocol } from "@/lib/umdp";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Message = {
  id: number;
  sender: 'A' | 'B';
  text: string;
};

type RelayStatus = {
  text: string;
  type: 'ok' | 'error' | 'info';
} | null;

export default function Home() {
  const { toast } = useToast();
  const [protocol, setProtocol] = useState<UMDProtocol | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [aliceInput, setAliceInput] = useState("");
  const [bobInput, setBobInput] = useState("");
  const [relayInput, setRelayInput] = useState("");
  const [relayStatus, setRelayStatus] = useState<RelayStatus>({ text: "Awaiting datagram...", type: "info" });
  const [joinSessionId, setJoinSessionId] = useState("");
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);

  const aliceMessagesEndRef = useRef<HTMLDivElement>(null);
  const bobMessagesEndRef = useRef<HTMLDivElement>(null);

  const initializeSession = (sessionId?: string) => {
    const newProtocol = new UMDProtocol(sessionId);
    setProtocol(newProtocol);
    setMessages([]);
    setAliceInput("");
    setBobInput("");
    setRelayInput("");
    setRelayStatus({ text: `Session ${sessionId ? 'joined' : 'started'}: ${newProtocol.sessionId}. Alice to start.`, type: "info" });
    toast({
      title: `Session ${sessionId ? 'Joined' : 'Initialized'}`,
      description: `Session ID: ${newProtocol.sessionId}`,
    });
  };

  useEffect(() => {
    initializeSession();
  }, []);

  useEffect(() => {
    aliceMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.filter(m => m.sender === 'A').length]);

  useEffect(() => {
    bobMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.filter(m => m.sender === 'B').length]);

  const handleSend = (sender: 'A' | 'B') => {
    if (!protocol) return;
    const messageText = sender === 'A' ? aliceInput : bobInput;
    if (!messageText.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Message cannot be empty." });
      return;
    }

    try {
      const datagram = protocol.pack(messageText, sender);
      setRelayInput(datagram);
      setRelayStatus({ text: `Datagram from ${sender === 'A' ? 'Alice' : 'Bob'} ready for relay.`, type: "info" });
      setMessages(prev => [...prev, { id: Date.now(), sender, text: messageText }]);
      if (sender === 'A') setAliceInput("");
      else setBobInput("");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Protocol Error", description: error.message });
      setRelayStatus({ text: error.message, type: "error" });
    }
  };

  const handleRelay = () => {
    if (!protocol) return;
    if (!relayInput.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Relay input cannot be empty." });
      return;
    }

    try {
      const { message, sender } = protocol.unpack(relayInput);
      
      const newProtocol = Object.assign(Object.create(Object.getPrototypeOf(protocol)), protocol);
      setProtocol(newProtocol);
      
      const receiver = sender === 'A' ? 'B' : 'A';
      setMessages(prev => [...prev, { id: Date.now(), sender: receiver, text: message }]);
      setRelayStatus({ text: `Datagram from ${sender === 'A' ? 'Alice' : 'Bob'} verified and delivered.`, type: "ok" });
      setRelayInput("");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Protocol Error", description: error.message });
      setRelayStatus({ text: error.message, type: "error" });
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied to Clipboard" });
    }, (err) => {
      toast({ variant: "destructive", title: "Copy Failed", description: err.message });
    });
  };

  const getStatusIcon = (statusType: RelayStatus['type']) => {
    switch (statusType) {
      case 'ok': return <ShieldCheck className="text-green-500" />;
      case 'error': return <ShieldX className="text-red-500" />;
      case 'info': return <Network className="text-blue-400" />;
      default: return null;
    }
  }

  const handleJoinSession = () => {
    if (joinSessionId.trim()) {
      initializeSession(joinSessionId.trim());
      setIsJoinDialogOpen(false);
      setJoinSessionId("");
    } else {
      toast({ variant: "destructive", title: "Error", description: "Session ID cannot be empty." });
    }
  };


  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8">
        <h1 className="font-headline text-4xl font-bold tracking-tight text-primary">UMDP Relay</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">A simulation of a User-Mediated Datagram Protocol. Two AIs, Alice and Bob, communicate through you. Create a message, copy the generated datagram, and relay it to the other party.</p>
        <div className="mt-4 flex justify-center gap-2">
          <Button onClick={() => initializeSession()} variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Session
          </Button>
           <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <LogIn className="mr-2 h-4 w-4" />
                Join Session
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join an Existing Session</DialogTitle>
                <DialogDescription>
                  Enter the Session ID from another agent to start communicating with them.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="session-id" className="text-right">
                    Session ID
                  </Label>
                  <Input
                    id="session-id"
                    value={joinSessionId}
                    onChange={(e) => setJoinSessionId(e.target.value)}
                    className="col-span-3"
                    placeholder="Paste session ID here"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleJoinSession}>Join Session</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Alice Panel */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bot /> AI Alice</CardTitle>
            <CardDescription>Alice sends messages from here.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col gap-4">
            <ScrollArea className="h-64 w-full pr-4 border rounded-md p-2">
               {messages.map(msg => (
                msg.sender === 'A' && (
                  <div key={msg.id} className="mb-2 p-2 rounded-lg bg-secondary text-secondary-foreground text-sm">
                    {msg.text}
                  </div>
                )
              ))}
              <div ref={aliceMessagesEndRef} />
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 items-start">
            <Textarea
              value={aliceInput}
              onChange={(e) => setAliceInput(e.target.value)}
              placeholder="Type message..."
              disabled={protocol?.lastSender === 'A'}
            />
            <Button onClick={() => handleSend('A')} disabled={protocol?.lastSender === 'A'}>
              <SendHorizonal className="mr-2 h-4 w-4" /> Send as Alice
            </Button>
          </CardFooter>
        </Card>

        {/* Relay Panel */}
        <Card className="flex flex-col bg-card/50 border-primary/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User /> UMDP Relay (You)</CardTitle>
            <CardDescription>Copy datagrams here to relay them.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col gap-4">
            <div className="flex items-center gap-2 text-sm p-2 rounded-md bg-background">
                {relayStatus && getStatusIcon(relayStatus.type)}
                <span className={cn({
                    'text-green-400': relayStatus?.type === 'ok',
                    'text-red-400': relayStatus?.type === 'error',
                    'text-blue-300': relayStatus?.type === 'info',
                })}>{relayStatus?.text}</span>
            </div>
            <div className="relative flex-grow">
              <Textarea
                value={relayInput}
                onChange={(e) => setRelayInput(e.target.value)}
                placeholder="Paste datagram here..."
                className="h-full resize-none"
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2"
                onClick={() => handleCopyToClipboard(relayInput)}
                disabled={!relayInput}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
             {protocol && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="w-full justify-center p-2">Session: {protocol.sessionId}</Badge>
                <Button variant="outline" size="icon" onClick={() => handleCopyToClipboard(protocol.sessionId)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleRelay} className="w-full bg-accent hover:bg-accent/90">
              <Network className="mr-2 h-4 w-4" /> Relay Datagram
            </Button>
          </CardFooter>
        </Card>

        {/* AI Bob Panel */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bot /> AI Bob</CardTitle>
            <CardDescription>Bob sends messages from here.</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col gap-4">
            <ScrollArea className="h-64 w-full pr-4 border rounded-md p-2">
              {messages.map(msg => (
                msg.sender === 'B' && (
                  <div key={msg.id} className="mb-2 p-2 rounded-lg bg-secondary text-secondary-foreground text-sm">
                    {msg.text}
                  </div>
                )
              ))}
              <div ref={bobMessagesEndRef} />
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 items-start">
            <Textarea
              value={bobInput}
              onChange={(e) => setBobInput(e.target.value)}
              placeholder="Type message..."
              disabled={protocol?.lastSender === 'B'}
            />
            <Button onClick={() => handleSend('B')} disabled={protocol?.lastSender === 'B'}>
              <SendHorizonal className="mr-2 h-4 w-4" /> Send as Bob
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
