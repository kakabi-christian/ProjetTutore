import api from "./api";
import type { Feedback, FeedbackRequestData } from "../models/Feedback";

const FeedbackService = {
  /**
   * Envoie un nouveau feedback ou met à jour l'existant (Client)
   * Route: POST /api/feedback
   */
  submitFeedback: async (data: FeedbackRequestData): Promise<{ message: string; data: Feedback }> => {
    const response = await api.post("/feedback", data);
    return response.data;
  },

};

export default FeedbackService;