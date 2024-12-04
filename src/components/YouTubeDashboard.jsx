import React, { useState, useEffect } from 'react';

const YouTubeDashboard = () => {
  const [data, setData] = useState({ 
    items: [], 
    pagination: { 
      current_page: 1,
      total_items: 0, 
      total_pages: 0,
      items_per_page: 20
    } 
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedChannels, setSelectedChannels] = useState(new Set());

  const fetchData = async (page = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://m4ks023065.execute-api.ap-southeast-2.amazonaws.com/prod/get-youtube-rankings-dynamodb?page=${page}&limit=20`
      );

      if (!response.ok) {
        throw new Error(`APIリクエストエラー (${response.status})`);
      }

      const jsonData = await response.json();
      if (!jsonData.items || !Array.isArray(jsonData.items)) {
        throw new Error('無効なデータ形式です');
      }

      setData(jsonData);
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  const Pagination = () => {
    const { total_pages = 1 } = data.pagination || {};

    const getPageNumbers = () => {
      const pages = [];
      if (total_pages <= 7) {
        for (let i = 1; i <= total_pages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          pages.push(1, 2, 3, 4, 5, '...', total_pages);
        } else if (currentPage >= total_pages - 2) {
          pages.push(1, '...', total_pages - 4, total_pages - 3, total_pages - 2, total_pages - 1, total_pages);
        } else {
          pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', total_pages);
        }
      }
      return pages;
    };

    return (
      <div className="flex items-center justify-center space-x-2">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1 || isLoading}
          className="px-3 py-1 rounded border disabled:opacity-50"
        >
          {'<'}
        </button>

        {getPageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-3 py-1">...</span>
            ) : (
              <button
                onClick={() => page !== currentPage && setCurrentPage(page)}
                disabled={isLoading}
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
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, total_pages))}
          disabled={currentPage === total_pages || isLoading}
          className="px-3 py-1 rounded border disabled:opacity-50"
        >
          {'>'}
        </button>
      </div>
    );
  };

  const exportToCSV = () => {
    if (!data?.items) return;

    const selectedData = data.items.filter(
      channel => selectedChannels.has(channel.youtube_url)
    );

    const csvContent = [
      ['順位', 'チャンネル名', 'URL', '登録者数', '月間再生数', 'ランキング変動'],
      ...selectedData.map(channel => [
        channel.rank,
        channel.channel_name,
        channel.youtube_url,
        channel.subscriber_count,
        channel.monthly_views,
        channel.rank_change
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `youtube_ranking_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getRankChangeDisplay = (change) => {
    if (change === 'new' || change === '-') {
      return '-';
    }
    return change.startsWith('↑') ? 
      `↑${change.slice(1)}` : 
      `↓${change.slice(1)}`;
  };

  const formatNumber = num => new Intl.NumberFormat('ja-JP').format(num);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
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

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">YouTubeチャンネルランキング分析</h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={exportToCSV}
              disabled={selectedChannels.size === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              CSVダウンロード
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">選択</th>
                <th className="px-4 py-2 text-left">順位</th>
                <th className="px-4 py-2 text-left">チャンネル名</th>
                <th className="px-4 py-2 text-left">変動</th>
                <th className="px-4 py-2 text-right">登録者数</th>
                <th className="px-4 py-2 text-right">月間再生数</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((channel) => (
                <tr key={channel.youtube_url} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <input
                      type="checkbox"
                      checked={selectedChannels.has(channel.youtube_url)}
                      onChange={(e) => {
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
                  <td className="px-4 py-2">{channel.rank}</td>
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
                    {channel.rank_change === 'new' ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        NEW
                      </span>
                    ) : (
                      <span className={channel.rank_change.startsWith('↑') ? 'text-green-600' : 'text-red-600'}>
                        {getRankChangeDisplay(channel.rank_change)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {formatNumber(channel.subscriber_count)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {formatNumber(channel.monthly_views)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <Pagination />
        </div>
      </div>
    </div>
  );
};

export default YouTubeDashboard;
