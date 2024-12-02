import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, MinusCircle, Download, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

const YouTubeDashboard = () => {
  // 基本的なstate
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ページネーション用state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  // ソートとフィルター用state
  const [sortField, setSortField] = useState('current_rank');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filters, setFilters] = useState({
    subscribersMin: '',
    subscribersMax: '',
    viewsMin: '',
    viewsMax: '',
    newOnly: false
  });

  // チェックボックス用state
  const [selectedChannels, setSelectedChannels] = useState(new Set());

  // データ取得
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('https://m4ks023065.execute-api.ap-southeast-2.amazonaws.com/prod/comparison');
      if (!response.ok) throw new Error('API request failed');
      const jsonData = await response.json();
      console.log("API Response:", jsonData);  // デバッグ用
      console.log("Response structure:", {
      hasComparison: 'comparison' in jsonData,
      hasChanges: 'comparison' in jsonData && 'changes' in jsonData.comparison,
      dataKeys: Object.keys(jsonData),
      status: response.status
    });
      setData(jsonData);
    } catch (err) {
      console.error("Fetch error:", err);  // エラーの詳細をログ出力
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // フィルタリング関数
  const filterChannels = (channels) => {
    return channels.filter(channel => {
      const subscribers = channel.current_stats.subscriber_count;
      const views = channel.current_stats.monthly_views;
      const isNew = channel.rank_change_text === 'new';

      return (
        (!filters.subscribersMin || subscribers >= Number(filters.subscribersMin)) &&
        (!filters.subscribersMax || subscribers <= Number(filters.subscribersMax)) &&
        (!filters.viewsMin || views >= Number(filters.viewsMin)) &&
        (!filters.viewsMax || views <= Number(filters.viewsMax)) &&
        (!filters.newOnly || isNew)
      );
    });
  };

  // ソート関数
  const sortChannels = (channels) => {
    return [...channels].sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'subscriber_count':
          aValue = a.current_stats.subscriber_count;
          bValue = b.current_stats.subscriber_count;
          break;
        case 'monthly_views':
          aValue = a.current_stats.monthly_views;
          bValue = b.current_stats.monthly_views;
          break;
        default:
          aValue = a.current_rank;
          bValue = b.current_rank;
      }

      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  };
  // CSVエクスポート関数
  const exportToCSV = () => {
    if (!data?.comparison?.changes) return;

    const selectedData = data.comparison.changes.filter(
      channel => selectedChannels.has(channel.youtube_url)
    );

    const csvContent = [
      ['順位', 'チャンネル名', 'URL', '登録者数', '月間再生数', 'ランキング変動'],
      ...selectedData.map(channel => [
        channel.current_rank,
        channel.channel_name,
        channel.youtube_url,
        channel.current_stats.subscriber_count,
        channel.current_stats.monthly_views,
        channel.rank_change_text
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `youtube_ranking_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // ページネーション用の計算
  const processData = () => {
    if (!data?.comparison?.changes) return { channels: [], totalPages: 0 };

    let processedChannels = filterChannels(data.comparison.changes);
    processedChannels = sortChannels(processedChannels);

    const totalPages = Math.ceil(processedChannels.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return {
      channels: processedChannels.slice(startIndex, endIndex),
      totalPages
    };
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
          <h3 className="text-red-800 font-medium">エラーが発生しました</h3>
          <p className="text-red-700">{error}</p>
          <button 
            onClick={fetchData}
            className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 font-semibold py-2 px-4 rounded"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  const { channels, totalPages } = processData();
  const formatNumber = num => new Intl.NumberFormat('ja-JP').format(num);

  const getRankChangeIcon = (change) => {
    if (change === 0) {
      return <MinusCircle className="inline text-gray-500 w-4 h-4" />;
    }
    return change > 0 ? 
      <ArrowUpCircle className="inline text-green-500 w-4 h-4" /> : 
      <ArrowDownCircle className="inline text-red-500 w-4 h-4" />;
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        {/* ヘッダー部分 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">YouTubeチャンネルランキング分析</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={exportToCSV}
              disabled={selectedChannels.size === 0}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              <Download className="w-4 h-4 mr-2" />
              選択したチャンネルをCSVエクスポート
            </button>
            <p className="text-sm text-gray-600">
              更新日時: {new Date(data.metadata.generated_at).toLocaleString('ja-JP')}
            </p>
          </div>
        </div>

        {/* フィルター部分 */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">登録者数</label>
            <div className="flex space-x-2 mt-1">
              <input
                type="number"
                placeholder="最小"
                value={filters.subscribersMin}
                onChange={e => setFilters(prev => ({ ...prev, subscribersMin: e.target.value }))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              <input
                type="number"
                placeholder="最大"
                value={filters.subscribersMax}
                onChange={e => setFilters(prev => ({ ...prev, subscribersMax: e.target.value }))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">月間再生数</label>
            <div className="flex space-x-2 mt-1">
              <input
                type="number"
                placeholder="最小"
                value={filters.viewsMin}
                onChange={e => setFilters(prev => ({ ...prev, viewsMin: e.target.value }))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              <input
                type="number"
                placeholder="最大"
                value={filters.viewsMax}
                onChange={e => setFilters(prev => ({ ...prev, viewsMax: e.target.value }))}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="flex items-center">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.newOnly}
                onChange={e => setFilters(prev => ({ ...prev, newOnly: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">新規エントリーのみ表示</span>
            </label>
          </div>
        </div>
{/* テーブル */}
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">
                  <input
                    type="checkbox"
                    checked={selectedChannels.size === channels.length}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedChannels(new Set(channels.map(c => c.youtube_url)));
                      } else {
                        setSelectedChannels(new Set());
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-4 py-2 text-left">順位</th>
                <th className="px-4 py-2 text-left">チャンネル名</th>
                <th className="px-4 py-2 text-left">変動</th>
                <th className="px-4 py-2 text-right group cursor-pointer" onClick={() => {
                  if (sortField === 'subscriber_count') {
                    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortField('subscriber_count');
                    setSortDirection('desc');
                  }
                }}>
                  <div className="flex items-center justify-end">
                    登録者数
                    <ArrowUpDown className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100" />
                  </div>
                </th>
                <th className="px-4 py-2 text-right">登録者数増減</th>
                <th className="px-4 py-2 text-right group cursor-pointer" onClick={() => {
                  if (sortField === 'monthly_views') {
                    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortField('monthly_views');
                    setSortDirection('desc');
                  }
                }}>
                  <div className="flex items-center justify-end">
                    月間再生数
                    <ArrowUpDown className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {channels.map((channel) => (
                <tr key={channel.youtube_url} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      checked={selectedChannels.has(channel.youtube_url)}
                      onChange={e => {
                        const newSelected = new Set(selectedChannels);
                        if (e.target.checked) {
                          newSelected.add(channel.youtube_url);
                        } else {
                          newSelected.delete(channel.youtube_url);
                        }
                        setSelectedChannels(newSelected);
                      }}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-2">{channel.current_rank}</td>
                  <td className="px-4 py-2">
                    <a 
                      href={channel.youtube_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center"
                    >
                      <img
                        src={channel.icon_url}
                        alt=""
                        className="w-8 h-8 rounded-full mr-2"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/32";
                        }}
                      />
                      {channel.channel_name}
                    </a>
                  </td>
                  <td className="px-4 py-2">
                    {channel.rank_change_text === 'new' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        NEW
                      </span>
                    ) : (
                      <>
                        {getRankChangeIcon(channel.rank_change)}
                        <span className="ml-1">{channel.rank_change_text}</span>
                      </>
                    )}
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

        {/* ページネーション */}
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <select
              value={itemsPerPage}
              onChange={e => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded border-gray-300"
            >
              <option value={20}>20件</option>
              <option value={50}>50件</option>
              <option value={100}>100件</option>
            </select>
            <span className="text-sm text-gray-600">
              全{data.comparison.changes.length}件中 
              {(currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, data.comparison.changes.length)}件を表示
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={e => {
                const page = Number(e.target.value);
                if (page >= 1 && page <= totalPages) {
                  setCurrentPage(page);
                }
              }}
              className="w-16 text-center rounded border-gray-300"
            />
            <span className="text-gray-600">/ {totalPages}</span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border disabled:opacity-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouTubeDashboard;
