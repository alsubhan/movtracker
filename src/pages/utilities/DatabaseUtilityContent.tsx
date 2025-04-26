import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Database, Download, Upload, HardDrive, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const DatabaseUtilityContent = () => {
  const { toast } = useToast();
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupFile, setBackupFile] = useState<File | null>(null);

  interface HistoryEntry { id: string; filename: string; date: string; size: string; status: string; }
  const [backupHistory, setBackupHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/history`);
        if (!res.ok) throw new Error('Failed to load history');
        const data: HistoryEntry[] = await res.json();
        setBackupHistory(data);
      } catch (error) {
        toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
      }
    };
    fetchHistory();
  }, [toast]);

  const handleBackupStart = async () => {
    setIsBackingUp(true);
    try {
      const res = await fetch(`${API_BASE}/api/backup`);
      if (!res.ok) throw new Error('Backup failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${Date.now()}.sql`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: 'Backup Completed', description: 'Database backup downloaded' });
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreStart = async () => {
    if (!backupFile) {
      toast({ title: 'No File Selected', description: 'Select a backup file', variant: 'destructive' });
      return;
    }
    setIsRestoring(true);
    try {
      const form = new FormData();
      form.append('file', backupFile);
      const res = await fetch(`${API_BASE}/api/restore`, { method: 'POST', body: form });
      if (!res.ok) throw new Error('Restore failed');
      toast({ title: 'Restore Completed', description: 'Database has been restored' });
      setBackupFile(null);
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBackupFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Backup Database</CardTitle>
          <CardDescription>
            Create a backup of your current database for safekeeping
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important</AlertTitle>
            <AlertDescription>
              Regular backups help prevent data loss. We recommend performing backups at least once a week.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span>Current Database Size: <span className="font-medium">26.8 MB</span></span>
              </div>
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <span>Last Backup: <span className="font-medium">2023-06-15 14:00</span></span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Cancel</Button>
          <Button 
            onClick={handleBackupStart} 
            disabled={isBackingUp}
            className="flex items-center gap-2"
          >
            {isBackingUp ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                Backing Up...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Start Backup
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Restore Database</CardTitle>
          <CardDescription>
            Restore your database from a previously created backup file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Restoring a database will overwrite all current data. This action cannot be undone.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="backupFile">Select Backup File</Label>
              <Input 
                id="backupFile" 
                type="file" 
                accept=".sql,.bak,.dump" 
                onChange={handleFileChange}
                disabled={isRestoring}
              />
            </div>

            {backupFile && (
              <div className="p-3 border rounded-md bg-muted/50">
                <p className="text-sm font-medium">Selected File:</p>
                <p className="text-sm">{backupFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(backupFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setBackupFile(null)} disabled={!backupFile || isRestoring}>
            Clear
          </Button>
          <Button 
            onClick={handleRestoreStart} 
            disabled={!backupFile || isRestoring}
            variant="default"
            className="flex items-center gap-2"
          >
            {isRestoring ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                Restoring...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Start Restore
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
          <CardDescription>List of all backups performed</CardDescription>
        </CardHeader>
        <CardContent>
          {backupHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground">No backups found.</p>
          ) : (
            <ul className="space-y-2">
              {backupHistory.map(entry => (
                <li key={entry.id} className="flex justify-between text-sm">
                  <span>{entry.filename}</span>
                  <span>{new Date(entry.date).toLocaleString()}</span>
                  <span>{entry.size}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseUtilityContent;
