import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, MinusCircle } from 'lucide-react';

const YouTubeDashboard = () => {
  const [channelData, setChannelData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('https://m4ks023065.execute-api.ap-southeast-2.amazonaws.com/prod/comparison');
        if (!response.ok) {
          throw new Error('データの取得に失敗しました');
        }
        const data = await response.json();
        setChannelData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // ランキング変動を矢印アイコンで表示
  const getRankChange = (previous, current) => {
    if (previous > current) {
      return <ArrowUpCircle className="text-green-500 inline" />;
    } else if (previous < current) {
      return <ArrowDownCircle className="text-red-500 inline" />;
    }
    return <MinusCircle className="text-gray-500 inline" />;
  };

  // 数値のフォーマット
  const formatNumber = (num) => {
    return new Intl.NumberFormat('ja-JP').format(num);
  };

  // 変化率の計算とフォーマット
  const getChangePercentage = (current, change) => {
    const percentage = (change / (current - change)) * 100;
    return `${percentage.toFixed(1)}%`;
  };

  if (isLoading) {
    return <div>データを読み込んでいます...</div>;
  }

  if (error) {
    return <div>エラーが発生しました: {error}</div>;
  }

  // グラフ用データの準備
  const subscriberGraphData = channelData.map(channel => ({
    name: channel.name,
    '登録者数': channel.subscribers,
    '増減': channel.subscriberChange
  }));

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* ランキング変動テーブル */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">ランキング変動</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>チャンネル名</TableHead>
              <TableHead>前回順位</TableHead>
              <TableHead>現在順位</TableHead>
              <TableHead>変動</TableHead>
              <TableHead>登録者数</TableHead>
              <TableHead>登録者増減</TableHead>
              <TableHead>再生回数</TableHead>
              <TableHead>再生回数増減</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {channelData.map((channel, index) => (
              <TableRow key={index}>
                <TableCell>{channel.name}</TableCell>
                <TableCell>{channel.previousRank}</TableCell>
                <TableCell>{channel.currentRank}</TableCell>
                <TableCell>
                  {getRankChange(channel.previousRank, channel.currentRank)}
                </TableCell>
                <TableCell>{formatNumber(channel.subscribers)}</TableCell>
                <TableCell className={channel.subscriberChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatNumber(channel.subscriberChange)}
                  ({getChangePercentage(channel.subscribers, channel.subscriberChange)})
                </TableCell>
                <TableCell>{formatNumber(channel.views)}</TableCell>
                <TableCell className={channel.viewChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatNumber(channel.viewChange)}
                  ({getChangePercentage(channel.views, channel.viewChange)})
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 登録者数グラフ */}
      <div className="h-96">
        <h3 className="text-lg font-semibold mb-4">チャンネル別登録者数比較</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={subscriberGraphData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="登録者数" fill="#4f46e5" />
            <Bar dataKey="増減" fill="#22c55e" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default YouTubeDashboard;
