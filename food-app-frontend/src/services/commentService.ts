import api from './api';
import type { Comment, ApiResponse } from '@/types';

const apiVersion= import.meta.env.VITE_API_VERSION;
export const commentService = {
  /**
   * Fetches comments for a specific post.
   * @param postId The ID of the post to get comments for.
   * @returns A promise that resolves with an array of Comment objects.
   */
  async getComments(postId: string): Promise<Comment[]> {
    const response = await api.get<ApiResponse<Comment[]>>(`${apiVersion}/posts/${postId}/comments`);
    return response.data.data || [];
  },

  /**
   * Creates a new comment on a post.
   * @param postId The ID of the post to comment on.
   * @param body The comment text.
   * @param parentId Optional parent comment ID for replies.
   * @returns A promise that resolves with the newly created Comment object.
   */
  async createComment(postId: string, body: string, parentId?: string): Promise<Comment> {
    const data = { body, parent_id: parentId };
    const response = await api.post<ApiResponse<Comment>>(`${apiVersion}/posts/${postId}/comments`, data);
    if (!response.data.data) {
      throw new Error('Failed to create comment');
    }
    return response.data.data;
  },

  /**
   * Deletes a comment.
   * @param postId The ID of the post the comment belongs to.
   * @param commentId The ID of the comment to delete.
   * @returns A promise that resolves when the comment is deleted.
   */
  async deleteComment(postId: string, commentId: string): Promise<void> {
    await api.delete(`${apiVersion}/posts/${postId}/comments/${commentId}`);
  },

  /**
   * Toggles the like status for a specific comment.
   * @param commentId The ID of the comment to like or unlike.
   * @returns A promise that resolves with the updated like count.
   */
  async toggleCommentLike(commentId: string): Promise<{ likes_count: number }> {
    const response = await api.post(`${apiVersion}/comments/${commentId}/like`);
    return response.data;
  },
};
