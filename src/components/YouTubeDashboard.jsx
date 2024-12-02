import React, { useState, useEffect } from 'react';
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
    return <div className="p-4">データを読み込んでいます...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">エラーが発生しました: {error}</div>;
  }

  // グラフ用データの準備
  const subscriberGraphData = channelData.map(channel => ({
    name: channel.name,
    '登録者数': channel.subscribers,
    '増減': channel.subscriberChange
  }));

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">YouTubeチャンネルランキング分析</h2>
        
        {/* ランキング変動テーブル */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">ランキング変動</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">チャンネル名</th>
                  <th className="px-4 py-2 text-left">前回順位</th>
                  <th className="px-4 py-2 text-left">現在順位</th>
                  <th className="px-4 py-2 text-left">変動</th>
                  <th className="px-4 py-2 text-left">登録者数</th>
                  <th className="px-4 py-2 text-left">登録者増減</th>
                  <th className="px-4 py-2 text-left">再生回数</th>
                  <th className="px-4 py-2 text-left">再生回数増減</th>
                </tr>
              </thead>
              <tbody>
                {channelData.map((channel, index) => (
                  <tr key={index} className="border-b">
                    <td className="px-4 py-2">{channel.name}</td>
                    <td className="px-4 py-2">{channel.previousRank}</td>
                    <td className="px-4 py-2">{channel.currentRank}</td>
                    <td className="px-4 py-2">
                      {getRankChange(channel.previousRank, channel.currentRank)}
                    </td>
                    <td className="px-4 py-2">{formatNumber(channel.subscribers)}</td>
                    <td className={`px-4 py-2 ${channel.subscriberChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatNumber(channel.subscriberChange)}
                      ({getChangePercentage(channel.subscribers, channel.subscriberChange)})
                    </td>
                    <td className="px-4 py-2">{formatNumber(channel.views)}</td>
                    <td className={`px-4 py-2 ${channel.viewChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatNumber(channel.viewChange)}
                      ({getChangePercentage(channel.views, channel.viewChange)})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
    </div>
  );
};

export default YouTubeDashboard;
