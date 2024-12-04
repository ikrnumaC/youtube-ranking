import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, MinusCircle, Download, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

const YouTubeDashboard = () => {
  // 基本的なstate
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [cachedData, setCachedData] = useState({});

  // ページネーション用state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
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
  const fetchData = async (page = 1) => {
    if (cachedData[page]) {
      return cachedData[page];
    }

    try {
      setIsLoading(true);
      const response = await fetch(
        `https://m4ks023065.execute-api.ap-southeast-2.amazonaws.com/prod/comparison?page=${page}&pageSize=${itemsPerPage}`
      );
      
      if (!response.ok) throw new Error('API request failed');
      
      const jsonData = await response.json();
      const parsedData = JSON.parse(jsonData.body);

      // キャッシュを更新
      setCachedData(prev => ({
        ...prev,
        [page]: parsedData
      }));

      return parsedData;
    } catch (err) {
      console.error("Fetch error:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // プリフェッチ
  const prefetchData = async (page) => {
    if (!cachedData[page] && page > 0 && page <= Math.ceil(totalItems / itemsPerPage)) {
      try {
        await fetchData(page);
      } catch (error) {
        console.error(`Prefetch error for page ${page}:`, error);
      }
    }
  };

  // メインのデータ取得
  useEffect(() => {
    const loadCurrentPage = async () => {
      try {
        const parsedData = await fetchData(currentPage);
        setData(parsedData);
        setTotalItems(parsedData.pagination.total_items);
        
        // 次のページと前のページをプリフェッチ
        prefetchData(currentPage + 1);
        prefetchData(currentPage - 1);
      } catch (err) {
        setError(err.message);
      }
    };

    loadCurrentPage();
  }, [currentPage]);

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

  // ページネーションコンポーネント
  const Pagination = () => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    const getPageNumbers = () => {
      const pages = [];
      const showPageNumbers = (start, end) => {
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
      };

      if (totalPages <= 7) {
        showPageNumbers(1, totalPages);
      } else {
        if (currentPage <= 3) {
          showPageNumbers(1, 5);
          pages.push('...');
          pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1);
          pages.push('...');
          showPageNumbers(totalPages - 4, totalPages);
        } else {
          pages.push(1);
          pages.push('...');
          showPageNumbers(currentPage - 1, currentPage + 1);
          pages.push('...');
          pages.push(totalPages);
        }
      }

      return pages;
    };

    return (
      <div className="flex items-center justify-center space-x-2">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded border disabled:opacity-50"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        {getPageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-3 py-1">...</span>
            ) : (
              <button
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded border ${
                  currentPage === page ? 'bg-blue-500 text-white' : ''
                }`}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}

        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded border disabled:opacity-50"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const getRankChangeIcon = (change) => {
    if (change === 0) {
      return <MinusCircle className="inline text-gray-500 w-4 h-4" />;
    }
    return change > 0 ? 
      <ArrowUpCircle className="inline text-green-500 w-4 h-4" /> : 
      <ArrowDownCircle className="inline text-red-500 w-4 h-4" />;
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
            onClick={() => fetchData(currentPage)}
            className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 font-semibold py-2 px-4 rounded"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  if (!data || !data.comparison || !data.comparison.changes) {
    return null;
  }

  const formatNumber = num => new Intl.NumberFormat('ja-JP').format(num);

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
                    checked={selectedChannels.size === data.comparison.changes.length}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedChannels(new Set(data.comparison.changes.map(c => c.youtube_url)));
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
              {data.comparison.changes.map((channel) => (
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
                        alt={`${channel.channel_name}のアイコン`}
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
              全{totalItems}件中 
              {(currentPage - 1) * itemsPerPage + 1}-
              {Math.min(currentPage * itemsPerPage, totalItems)}件を表示
            </span>
          </div>
          <Pagination />
        </div>
      </div>
    </div>
  );
};

export default YouTubeDashboard;
