import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatDate } from '../lib/dateUtils';
import { Card, CardTitle } from './ui';
import { useEntries } from '../hooks/useEntries';
import { useAuth } from '../hooks/useAuth';
import { FaChartBar } from 'react-icons/fa';
import type { Entry } from '../types';

interface ChartDataPoint {
  date: string;
  weight: number;
  formatted_date: string;
}

interface TooltipPayload {
  payload: ChartDataPoint;
}

export const WeightChart = () => {
  const { profile } = useAuth();
  const { data: entries, isLoading } = useEntries(50); // Get more entries for chart

  if (isLoading) {
    return (
      <Card>
        <CardTitle>Weight Journey</CardTitle>
        <div className="skeleton h-64 w-full" />
      </Card>
    );
  }

  if (!entries?.length) {
    return (
      <Card>
        <CardTitle>Weight Journey</CardTitle>
        <div className="flex items-center justify-center h-64 text-base-content/70">
          <div className="text-center">
            <div className="text-6xl mb-4">
              <FaChartBar />
            </div>
            <p>Your weight journey will appear here</p>
            <p className="text-sm">Add some entries to see your progress!</p>
          </div>
        </div>
      </Card>
    );
  }

  // Prepare chart data (reverse to show chronological order)
  const chartData: ChartDataPoint[] = entries
    .slice()
    .reverse()
    .map((entry: Entry) => ({
      date: entry.recorded_at,
      weight: entry.weight,
      formatted_date: formatDate.shortDate(entry.recorded_at),
    }));

  // Custom tooltip component
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: TooltipPayload[];
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const unit = profile?.preferred_unit || 'lbs';

      return (
        <div className="bg-base-100 border border-base-300 rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{formatDate.dateTime(data.date)}</p>
          <p className="text-primary">
            Weight: {data.weight} {unit}
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate weight change
  const firstWeight = chartData[0]?.weight;
  const lastWeight = chartData[chartData.length - 1]?.weight;
  const weightChange = lastWeight - firstWeight;
  const isPositive = weightChange > 0;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <CardTitle>Weight Journey</CardTitle>
        {chartData.length > 1 && (
          <div className="text-right">
            <div className="text-sm text-base-content/70">Total Change</div>
            <div
              className={`font-semibold ${
                isPositive ? 'text-warning' : 'text-success'
              }`}
            >
              {isPositive ? '+' : ''}
              {weightChange.toFixed(1)} {profile?.preferred_unit || 'lbs'}
            </div>
          </div>
        )}
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis
              dataKey="formatted_date"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={['dataMin - 2', 'dataMax + 2']}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="hsl(var(--p))"
              strokeWidth={3}
              dot={{
                fill: 'hsl(var(--p))',
                strokeWidth: 2,
                r: 4,
              }}
              activeDot={{
                r: 6,
                stroke: 'hsl(var(--p))',
                strokeWidth: 2,
                fill: 'hsl(var(--b1))',
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
