import Newsletter from "../models/Newsletter.js";
import ContactMessage from "../models/ContactMessage.js";

// Newsletter subscription
export const subscribe = async (req, res) => {
  try {
    const { email, name, source } = req.body;

    // Check if already subscribed
    const existing = await Newsletter.findOne({ email: email.toLowerCase() });
    if (existing) {
      if (existing.isActive) {
        return res.status(400).json({ message: 'You are already subscribed to our newsletter' });
      }
      // Reactivate subscription
      existing.isActive = true;
      existing.unsubscribedAt = null;
      existing.subscribedAt = new Date();
      await existing.save();
      return res.status(200).json({ message: 'Welcome back! Your subscription has been reactivated' });
    }

    const subscriber = new Newsletter({
      email: email.toLowerCase(),
      name: name || '',
      source: source || 'website'
    });

    await subscriber.save();
    res.status(201).json({ message: 'Thank you for subscribing to Preksha Fashion!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Unsubscribe
export const unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;

    const subscriber = await Newsletter.findOne({ email: email.toLowerCase() });
    if (!subscriber) {
      return res.status(404).json({ message: 'Email not found in our subscription list' });
    }

    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    res.status(200).json({ message: 'You have been unsubscribed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Get all subscribers
export const getAllSubscribers = async (req, res) => {
  try {
    const { active } = req.query;
    const filter = active !== undefined ? { isActive: active === 'true' } : {};
    
    const subscribers = await Newsletter.find(filter).sort({ subscribedAt: -1 });
    res.status(200).json({
      total: subscribers.length,
      subscribers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Contact form submission
export const submitContactForm = async (req, res) => {
  try {
    const { name, email, phone, subject, orderId, message } = req.body;

    const contact = new ContactMessage({
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      subject: subject || 'general',
      orderId: orderId || '',
      message
    });

    await contact.save();
    res.status(201).json({ 
      message: 'Thank you for contacting us! We will get back to you within 24-48 hours.',
      ticketId: contact._id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Get all contact messages
export const getAllContactMessages = async (req, res) => {
  try {
    const { status, subject } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (subject) filter.subject = subject;

    const messages = await ContactMessage.find(filter).sort({ createdAt: -1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Update contact message status
export const updateContactStatus = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status, adminNotes } = req.body;

    const message = await ContactMessage.findByIdAndUpdate(
      messageId,
      { 
        status, 
        adminNotes,
        respondedAt: status === 'resolved' ? new Date() : undefined
      },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.status(200).json({ message: 'Status updated successfully', data: message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Get message statistics
export const getMessageStats = async (req, res) => {
  try {
    const stats = await ContactMessage.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const subjectStats = await ContactMessage.aggregate([
      {
        $group: {
          _id: '$subject',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({ statusStats: stats, subjectStats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
