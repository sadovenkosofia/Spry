import { useCallback, useEffect, useState } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import { Plus } from "lucide-react";
import { createMeeting, listMeetings } from "@/api/meetings";
import { MeetingCard } from "@/components/MeetingCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Meeting, MeetingCreate } from "@/types/meeting";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [attendeesText, setAttendeesText] = useState("");

  useEffect(() => {
    async function checkUser() {
      try {
        await getCurrentUser();
        setIsAuthenticated(true);
      } catch (err) {
        setIsAuthenticated(false);
        window.location.href =
          "https://spry-shymchuk-auth.auth.us-east-1.amazoncognito.com/login?client_id=1tkojgihgq5cgt7987jg0faqpo&response_type=code&scope=email+openid+profile&redirect_uri=https://d3b5dueyhkda58.cloudfront.net/";
      } finally {
        setAuthLoading(false);
      }
    }
    void checkUser();
  }, []);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await listMeetings();
      setMeetings(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не вдалося завантажити зустрічі");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      void load();
    }
  }, [isAuthenticated, load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const attendees = attendeesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: MeetingCreate = {
      title,
      start_at: new Date(startAt).toISOString(),
      end_at: new Date(endAt).toISOString(),
      attendees,
    };

    try {
      await createMeeting(payload);
      setDialogOpen(false);
      setTitle("");
      setStartAt("");
      setEndAt("");
      setAttendeesText("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не вдалося створити зустріч");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return <div className="p-8 text-center text-muted-foreground">Завантаження...</div>;
  }

  if (!isAuthenticated) {
    return <div className="p-8 text-center text-muted-foreground">Перенаправлення на вхід...</div>;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <main className="mx-auto max-w-2xl px-6 py-14">
        <header className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Meetings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Заплановані відеодзвінки та події
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                New meeting
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Створити зустріч</DialogTitle>
                <DialogDescription>
                  Заповніть деталі нової події для розкладу.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div>
                  <label className="text-sm font-medium">Назва</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 w-full rounded-md border p-2 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Початок</label>
                    <input
                      type="datetime-local"
                      required
                      value={startAt}
                      onChange={(e) => setStartAt(e.target.value)}
                      className="mt-1 w-full rounded-md border p-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Завершення</label>
                    <input
                      type="datetime-local"
                      required
                      value={endAt}
                      onChange={(e) => setEndAt(e.target.value)}
                      className="mt-1 w-full rounded-md border p-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Учасники (по одному на рядок)</label>
                  <textarea
                    rows={3}
                    value={attendeesText}
                    onChange={(e) => setAttendeesText(e.target.value)}
                    className="mt-1 w-full rounded-md border p-2 text-sm"
                  />
                </div>

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? "Створення..." : "Зберегти"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </header>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Завантаження розкладу...</p>
        ) : meetings.length === 0 ? (
          <p className="text-sm text-muted-foreground">У вас поки немає запланованих зустрічей.</p>
        ) : (
          <div className="space-y-3">
            {meetings.map((m) => (
              <MeetingCard key={m.id} meeting={m} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
