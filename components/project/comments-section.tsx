"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Loader2, Heart, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link, useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    avatarUrl: string | null;
  };
}

export function CommentsSection({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations("Comments");
  const locale = useLocale();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  useEffect(() => {
    loadComments();
  }, [projectId]);

  async function loadComments() {
    const res = await fetch(`/api/projects/${projectId}/comments`);
    if (res.ok) {
      setComments(await res.json());
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (!user) {
      setLoginDialogOpen(true);
      return;
    }

    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/projects/${projectId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [comment, ...prev]);
        setNewComment("");
        toast.success(t("commentAdded"));
      }
    } catch (error) {
      console.error(error);
      toast.error(t("addError"));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(commentId: string) {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        toast.success(t("commentDeleted"));
      }
    } catch (error) {
      console.error(error);
      toast.error(t("deleteError"));
    }
  }

  const getLocaleForDate = () => {
    return locale === "es" ? "es-ES" : "en-US";
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex items-center gap-2 pb-4">
        <h2 className="text-2xl md:text-3xl font-bold">{t("title")}</h2>
        {comments.length > 0 && (
          <Badge variant="secondary" className="ml-2">
            {comments.length}
          </Badge>
        )}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit}>
        <Card className="border-2 shadow-md relative">
          <CardContent className="px-4 md:px-6 py-2 relative">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={t("placeholder")}
              rows={10}
              className="resize-none text-base max-h-[200px] min-h-[140px] pr-16 pb-12"
            />
            <div className="absolute bottom-5 right-9 flex items-center justify-center">
              <Button
                type="submit"
                disabled={loading || !newComment.trim()}
                size="icon"
                className="h-10 w-10 rounded-full shadow-lg hover:shadow-xl transition-shadow"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Login Dialog */}
      <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("loginToComment.title")}</DialogTitle>
            <DialogDescription>
              {t("loginToComment.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoginDialogOpen(false)}>
              {t("cancel")}
            </Button>
            <Button asChild>
              <Link href="/login">{t("login")}</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comments List */}
      <div className="space-y-4 md:space-y-5">
        {comments.map((comment) => (
          <Card
            key={comment.id}
            className="border shadow-sm hover:shadow-md transition-shadow"
          >
            <CardContent className="">
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10 md:h-12 md:w-12 flex-shrink-0">
                  <AvatarImage src={comment.user.avatarUrl || ""} />
                  <AvatarFallback>
                    {comment.user.name?.[0] ||
                      comment.user.username?.[0] ||
                      "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      {comment.user.username ? (
                        <Link
                          href={`/${comment.user.username}`}
                          className="font-semibold text-sm md:text-base hover:text-primary transition-colors cursor-pointer inline-block hover:underline"
                        >
                          {comment.user.name ||
                            comment.user.username ||
                            t("anonymous")}
                        </Link>
                      ) : (
                        <p className="font-semibold text-sm md:text-base">
                          {comment.user.name ||
                            comment.user.username ||
                            t("anonymous")}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString(
                          getLocaleForDate(),
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                    {user && user.uid === comment.user.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(comment.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm md:text-base text-foreground leading-relaxed whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {comments.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 md:py-16 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 rounded-full bg-muted mb-2">
                  <Heart className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">
                  {t("noComments")}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
