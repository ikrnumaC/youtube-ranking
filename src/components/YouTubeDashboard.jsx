import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, MinusCircle } from 'lucide-react';

const YouTubeDashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('https://m4ks023065.execute-api.ap-southeast-2.amazonaws.com/prod/comparison', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const jsonData = await response.json();
      setData(jsonData);
      
    } catch (err) {
      console.error('Fetch error details:', err);
      setError(`${err.name}: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ja-JP').format(num);
  };

  const getRankChangeIcon = (change) => {
    if (change === 0) {
      return <MinusCircle className="text-gray-500 inline" />;
    }
    return change > 0 ? 
      <ArrowUpCircle className="text-green-500 inline" /> : 
      <ArrowDownCircle className="text-red-500 inline" />;
  };

  // グラフ用データの準備
  const getGraphData = () => {
    if (!data?.comparison?.changes) return [];
    return data.comparison.changes.slice(0, 10).map(channel => ({
      name: channel.channel_name,
      '登録者数': channel.current_stats.subscriber_count,
      '月間再生回数': channel.current_stats.monthly_views
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p>データを読み込んでいます...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">エラーが発生しました</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
                <button 
                  onClick={fetchData}
                  className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 font-semibold py-2 px-4 rounded"
                >
                  再試行
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">YouTubeチャンネルランキング分析</h2>
          <p className="text-sm text-gray-600">
            更新日時: {new Date(data.metadata.generated_at).toLocaleString('ja-JP')}
          </p>
        </div>
        
        {/* ランキング変動テーブル */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">ランキング変動</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left">順位</th>
                  <th className="px-4 py-2 text-left">チャンネル名</th>
                  <th className="px-4 py-2 text-left">変動</th>
                  <th className="px-4 py-2 text-right">登録者数</th>
                  <th className="px-4 py-2 text-right">登録者数増減</th>
                  <th className="px-4 py-2 text-right">月間再生回数</th>
                </tr>
              </thead>
              <tbody>
                {data.comparison.changes.map((channel) => (
                  <tr key={channel.current_rank} className="border-b">
                    <td className="px-4 py-2">{channel.current_rank}</td>
                    <td className="px-4 py-2">
                      <a 
                        href={channel.youtube_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {channel.channel_name}
                      </a>
                    </td>
                    <td className="px-4 py-2">
                      {getRankChangeIcon(channel.rank_change)}
                      <span className="ml-1">{channel.rank_change_text}</span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatNumber(channel.current_stats.subscriber_count)}
                    </td>
                    <td className={`px-4 py-2 text-right ${
                      channel.subscriber_change.total > 0 ? 'text-green-600' : 
                      channel.subscriber_change.total < 0 ? 'text-red-600' : ''
                    }`}>
                      {channel.subscriber_change.total ? (
                        <>
                          {formatNumber(channel.subscriber_change.total)}
                          <span className="text-sm ml-1">
                            ({channel.subscriber_change.percent.toFixed(2)}%)
                          </span>
                        </>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {formatNumber(channel.current_stats.monthly_views)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* グラフ */}
        <div className="h-96">
          <h3 className="text-lg font-semibold mb-4">トップ10チャンネル分析</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={getGraphData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="登録者数" fill="#4f46e5" />
              <Bar dataKey="月間再生回数" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default YouTubeDashboard;
