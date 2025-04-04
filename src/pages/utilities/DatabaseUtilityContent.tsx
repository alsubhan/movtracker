
import { useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Database, Download, Upload, HardDrive, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const DatabaseUtilityContent = () => {
  const { toast } = useToast();
  const [backupProgress, setBackupProgress] = useState(0);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [backupHistory] = useState([
    {
      id: "1",
      filename: "rfid_backup_20230515_121030.sql",
      date: new Date("2023-05-15T12:10:30"),
      size: "24.5 MB",
      status: "completed",
    },
    {
      id: "2",
      filename: "rfid_backup_20230601_083022.sql",
      date: new Date("2023-06-01T08:30:22"),
      size: "25.1 MB",
      status: "completed",
    },
    {
      id: "3",
      filename: "rfid_backup_20230615_140055.sql",
      date: new Date("2023-06-15T14:00:55"),
      size: "26.8 MB",
      status: "completed",
    },
  ]);

  const handleBackupStart = () => {
    setIsBackingUp(true);
    setBackupProgress(0);

    // Simulate backup process
    const interval = setInterval(() => {
      setBackupProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsBackingUp(false);
          
          toast({
            title: "Backup Completed",
            description: "Database has been successfully backed up",
          });
          
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const handleRestoreStart = () => {
    if (!backupFile) {
      toast({
        title: "No File Selected",
        description: "Please select a backup file to restore",
        variant: "destructive",
      });
      return;
    }

    setIsRestoring(true);
    setRestoreProgress(0);

    // Simulate restore process
    const interval = setInterval(() => {
      setRestoreProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsRestoring(false);
          setBackupFile(null);
          
          toast({
            title: "Restore Completed",
            description: "Database has been successfully restored",
          });
          
          return 100;
        }
        return prev + 5;
      });
    }, 300);
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

            {isBackingUp && (
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span>Backup Progress</span>
                  <span>{backupProgress}%</span>
                </div>
                <Progress value={backupProgress} className="h-2" />
              </div>
            )}
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

            {isRestoring && (
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span>Restore Progress</span>
                  <span>{restoreProgress}%</span>
                </div>
                <Progress value={restoreProgress} className="h-2" />
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
          <CardDescription>
            View and download your previous database backups
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {backupHistory.map((backup) => (
              <div key={backup.id} className="flex items-center justify-between p-3 border rounded-md">
                <div className="flex items-start gap-3">
                  <Database className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{backup.filename}</p>
                    <p className="text-sm text-muted-foreground">
                      {backup.date.toLocaleString()} • {backup.size}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    <span>Download</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseUtilityContent;
