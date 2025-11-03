/**
 * RepaymentSchedule Component
 * 
 * Displays the complete payment schedule for a loan
 * Shows past, current, and future payments
 */

'use client';

import { PaymentScheduleItem } from '@/types/loan';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/calculations/loanCalculator';

interface RepaymentScheduleProps {
  schedule: PaymentScheduleItem[];
  assetSymbol?: string;
}

export function RepaymentSchedule({ schedule, assetSymbol = 'USD' }: RepaymentScheduleProps) {
  const getItemStatus = (item: PaymentScheduleItem) => {
    if (item.isPaid) return 'paid';
    if (item.isOverdue) return 'overdue';
    if (item.isUpcoming) return 'upcoming';
    return 'future';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'overdue':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'upcoming':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return '✓ Paid';
      case 'overdue':
        return '⚠ Overdue';
      case 'upcoming':
        return '→ Next Payment';
      default:
        return 'Upcoming';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return '✓';
      case 'overdue':
        return '⚠';
      case 'upcoming':
        return '→';
      default:
        return '○';
    }
  };

  if (schedule.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-center text-gray-500">No payment schedule available</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Schedule Summary */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">Total Payments</p>
            <p className="text-lg font-bold">{schedule.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-lg font-bold text-green-600">
              {schedule.filter((s) => s.isPaid).length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Remaining</p>
            <p className="text-lg font-bold text-blue-600">
              {schedule.filter((s) => !s.isPaid).length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Overdue</p>
            <p className="text-lg font-bold text-red-600">
              {schedule.filter((s) => s.isOverdue).length}
            </p>
          </div>
        </div>
      </Card>

      {/* Timeline View (Desktop) */}
      <div className="hidden md:block">
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Payment #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Principal
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Interest
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Total Payment
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Balance
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {schedule.map((item) => {
                  const status = getItemStatus(item);
                  const rowClass =
                    status === 'upcoming' ? 'bg-blue-50 font-semibold' : '';

                  return (
                    <tr key={item.installmentNumber} className={rowClass}>
                      <td className="px-4 py-3 text-sm">
                        <span className="flex items-center">
                          <span className="mr-2">{getStatusIcon(status)}</span>
                          {item.installmentNumber}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {item.dueDate.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {formatCurrency(item.principalAmount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">
                        {formatCurrency(item.interestAmount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">
                        {formatCurrency(item.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">
                        {formatCurrency(item.remainingBalance)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                            status
                          )}`}
                        >
                          {getStatusLabel(status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold border-t-2">
                  <td className="px-4 py-3 text-sm" colSpan={2}>
                    Total
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {formatCurrency(
                      schedule.reduce((sum, item) => sum + item.principalAmount, 0)
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {formatCurrency(
                      schedule.reduce((sum, item) => sum + item.interestAmount, 0)
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    {formatCurrency(schedule.reduce((sum, item) => sum + item.totalAmount, 0))}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-3">
        {schedule.map((item) => {
          const status = getItemStatus(item);

          return (
            <Card
              key={item.installmentNumber}
              className={`p-4 border-2 ${getStatusColor(status)}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <span className="text-2xl mr-2">{getStatusIcon(status)}</span>
                  <div>
                    <p className="font-semibold">Payment #{item.installmentNumber}</p>
                    <p className="text-xs">
                      {item.dueDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-1 text-xs font-semibold rounded-full border bg-white">
                  {getStatusLabel(status)}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Principal:</span>
                  <span className="font-semibold">{formatCurrency(item.principalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Interest:</span>
                  <span className="font-semibold">{formatCurrency(item.interestAmount)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Total Payment:</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(item.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Remaining Balance:</span>
                  <span className="font-semibold">{formatCurrency(item.remainingBalance)}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Amortization Chart Note */}
      <Card className="p-4 bg-blue-50">
        <p className="text-sm text-gray-700">
          <strong>💡 Note:</strong> Payments are calculated using an amortization schedule. Each
          payment consists of both principal and interest, with more interest paid in early
          payments and more principal in later payments.
        </p>
      </Card>
    </div>
  );
}
