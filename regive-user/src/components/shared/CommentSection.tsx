'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Input, message, Spin, Empty } from 'antd';
import { Heart, Send, Trash2, MessageCircle } from 'lucide-react';
import { commentService } from '@/services/commentService';
import { Comment, CommentTargetType } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDateTime } from '@/lib/format';

interface CommentSectionProps {
  targetType: CommentTargetType;
  targetId: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({ targetType, targetId }) => {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await commentService.list(targetType, targetId);
      setComments(data.comments);
      setTotal(data.total);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (targetId) loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType, targetId]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    try {
      setSubmitting(true);
      const created = await commentService.create(targetType, targetId, content.trim());
      setComments((prev) => [created, ...prev]);
      setTotal((prev) => prev + 1);
      setContent('');
      message.success('Bình luận đã được đăng');
    } catch (err: any) {
      message.error(err.message || 'Không thể đăng bình luận');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLike = async (comment: Comment) => {
    if (!user) return;
    try {
      setTogglingId(comment._id);
      const updated = await commentService.toggleLike(comment._id);
      setComments((prev) =>
        prev.map((c) =>
          c._id === comment._id
            ? { ...c, likeCount: updated.likeCount, likedByMe: updated.likedByMe }
            : c
        )
      );
    } catch (err: any) {
      message.error(err.message || 'Không thể thả tim');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (comment: Comment) => {
    try {
      await commentService.remove(comment._id);
      setComments((prev) => prev.filter((c) => c._id !== comment._id));
      setTotal((prev) => Math.max(0, prev - 1));
      message.success('Bình luận đã được xóa');
    } catch (err: any) {
      message.error(err.message || 'Không thể xóa bình luận');
    }
  };

  const authorName = (author: Comment['author']) =>
    typeof author === 'string' ? 'Người dùng' : author?.fullName || 'Người dùng';

  const canDelete = (comment: Comment) => {
    if (!user) return false;
    // User app chỉ cho role USER/BENEFICIARY — so sánh tác giả thay vì check role staff
    const authorId =
      typeof comment.author === 'string'
        ? comment.author
        : comment.author?._id || comment.author?.id;
    return authorId === user.id;
  };

  return (
    <section className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-5">
        <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-p-s600" />
          <span>Bình luận</span>
          <span className="text-xs text-gray-400 font-medium">({total})</span>
        </h3>
      </div>

      {user ? (
        <div className="mb-6">
          <Input.TextArea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Chia sẻ cảm nghĩ của bạn..."
            maxLength={2000}
            className="!rounded-xl"
          />
          <div className="flex justify-end mt-3">
            <Button
              type="primary"
              icon={<Send className="w-3.5 h-3.5" />}
              onClick={handleSubmit}
              loading={submitting}
              disabled={!content.trim()}
              className="rounded-xl bg-p-s600 hover:bg-p-s700 text-white font-bold"
            >
              Đăng bình luận
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 rounded-xl bg-n-s50 border border-n-s100 text-center text-sm text-n-s600">
          <Link href="/login" className="font-bold text-p-s700 hover:underline">
            Đăng nhập
          </Link>{' '}
          để bình luận và thả tim.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Spin />
        </div>
      ) : comments.length === 0 ? (
        <Empty
          description="Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ!"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment._id} className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-p-s100 to-p-s200 text-p-s700 font-black text-sm flex items-center justify-center shrink-0">
                {authorName(comment.author).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-n-s900">{authorName(comment.author)}</span>
                  <span className="text-[11px] text-n-s400">{formatDateTime(comment.createdAt)}</span>
                </div>
                <p className="text-sm text-n-s700 leading-relaxed mt-1 whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <button
                    onClick={() => handleToggleLike(comment)}
                    disabled={!user || togglingId === comment._id}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                      comment.likedByMe ? 'text-sec-s600' : 'text-n-s500 hover:text-sec-s600'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${comment.likedByMe ? 'fill-sec-s600' : ''}`} />
                    <span>{comment.likeCount}</span>
                  </button>
                  {canDelete(comment) && (
                    <button
                      onClick={() => handleDelete(comment)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-n-s400 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Xóa</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
