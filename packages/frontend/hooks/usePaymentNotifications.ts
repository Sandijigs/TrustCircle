/**
 * usePaymentNotifications Hook
 * 
 * Manages payment reminders and notifications for loans
 * Checks for upcoming payments and sends notifications
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useLoan } from './useLoan';
import { LoanDisplay, LoanStatus } from '@/types/loan';

interface PaymentNotification {
  id: string;
  loanId: string;
  type: 'upcoming' | 'due_today' | 'overdue' | 'reminder';
  title: string;
  message: string;
  daysUntilDue: number;
  amount: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  createdAt: Date;
}

export function usePaymentNotifications() {
  const { address } = useAccount();
  const { borrowerLoanIds } = useLoan();

  const [notifications, setNotifications] = useState<PaymentNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  /**
   * Check loans and generate notifications
   */
  const checkAndGenerateNotifications = useCallback(async () => {
    if (!address || !borrowerLoanIds || borrowerLoanIds.length === 0) {
      setNotifications([]);
      return;
    }

    const newNotifications: PaymentNotification[] = [];

    // For each loan, check payment status
    for (const loanId of borrowerLoanIds) {
      try {
        // Fetch loan data (simplified - in production would batch fetch)
        // const loan = await fetchLoanData(loanId);
        
        // For demo purposes, creating sample notifications
        // In production, this would check actual loan data
        
        // Example notification generation logic:
        // if (loan.status === LoanStatus.Active) {
        //   const daysUntilDue = calculateDaysUntilDue(loan.nextPaymentDue);
        //   
        //   if (daysUntilDue <= 0) {
        //     // Overdue
        //     newNotifications.push(createOverdueNotification(loan));
        //   } else if (daysUntilDue === 1) {
        //     // Due tomorrow
        //     newNotifications.push(createDueTomorrowNotification(loan));
        //   } else if (daysUntilDue <= 3) {
        //     // Due soon
        //     newNotifications.push(createUpcomingNotification(loan));
        //   } else if (daysUntilDue === 7) {
        //     // 1 week reminder
        //     newNotifications.push(createWeeklyReminder(loan));
        //   }
        // }
      } catch (err) {
        console.error(`Error checking loan ${loanId}:`, err);
      }
    }

    setNotifications(newNotifications);
    setUnreadCount(newNotifications.filter(n => !n.read).length);
  }, [address, borrowerLoanIds]);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  /**
   * Mark all as read
   */
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  /**
   * Clear notification
   */
  const clearNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => {
      const notification = notifications.find(n => n.id === notificationId);
      return notification && !notification.read ? prev - 1 : prev;
    });
  }, [notifications]);

  /**
   * Clear all notifications
   */
  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  /**
   * Send browser notification (if permission granted)
   */
  const sendBrowserNotification = useCallback(
    (title: string, body: string, icon?: string) => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: icon || '/logo.png',
          badge: '/badge.png',
          tag: 'payment-reminder',
          requireInteraction: true,
        });
      }
    },
    []
  );

  /**
   * Request notification permission
   */
  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  /**
   * Check for notifications periodically
   */
  useEffect(() => {
    checkAndGenerateNotifications();

    // Check every hour
    const interval = setInterval(checkAndGenerateNotifications, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [checkAndGenerateNotifications]);

  /**
   * Helper: Create notification object
   */
  const createNotification = (
    loanId: string,
    type: PaymentNotification['type'],
    title: string,
    message: string,
    daysUntilDue: number,
    amount: number,
    priority: PaymentNotification['priority']
  ): PaymentNotification => ({
    id: `${loanId}-${type}-${Date.now()}`,
    loanId,
    type,
    title,
    message,
    daysUntilDue,
    amount,
    priority,
    read: false,
    createdAt: new Date(),
  });

  /**
   * Get notifications by priority
   */
  const getNotificationsByPriority = useCallback((priority: PaymentNotification['priority']) => {
    return notifications.filter(n => n.priority === priority);
  }, [notifications]);

  /**
   * Get urgent notifications
   */
  const urgentNotifications = getNotificationsByPriority('urgent');

  /**
   * Get high priority notifications
   */
  const highPriorityNotifications = getNotificationsByPriority('high');

  return {
    notifications,
    unreadCount,
    urgentNotifications,
    highPriorityNotifications,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
    requestPermission,
    sendBrowserNotification,
    refresh: checkAndGenerateNotifications,
  };
}

/**
 * Helper function to format notification message
 */
export function formatNotificationMessage(
  type: string,
  amount: number,
  daysUntilDue: number
): string {
  switch (type) {
    case 'overdue':
      return `Your payment of $${amount.toFixed(2)} is ${Math.abs(daysUntilDue)} days overdue. Please make a payment immediately to avoid penalties.`;
    case 'due_today':
      return `Your payment of $${amount.toFixed(2)} is due today. Make your payment to stay on track.`;
    case 'upcoming':
      return `Your payment of $${amount.toFixed(2)} is due in ${daysUntilDue} days. Be prepared!`;
    case 'reminder':
      return `Reminder: You have a payment of $${amount.toFixed(2)} coming up in ${daysUntilDue} days.`;
    default:
      return `Payment notification`;
  }
}
