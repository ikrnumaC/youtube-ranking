import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, MinusCircle, Download, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

const YouTubeDashboard = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [cachedData, setCachedData] = useState({});

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  const [sortField, setSortField] = useState('rank');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filters, setFilters] = useState({
    subscribersMin: '',
    subscribersMax: '',
    viewsMin: '',
    viewsMax: '',
    newOnly: false
  });

  const [selectedChannels, setSelectedChannels] = useState(new Set());

  const fetchData = async (page = 1) => {
    if (cachedData[page]) {
      return cachedData[page];
    }

    try {
      setIsLoading(true);
      const response = await fetch(
        `https://m4ks023065.execute-api.ap-southeast-2.amazonaws.com/prod/get-youtube-rankings-dynamodb?page=${page}&limit=${itemsPerPage}`
      );
      
      if (!response.ok) throw new Error('API request failed');
      
      const jsonData = await response.json();

      setCachedData(prev => ({
        ...prev,
        [page]: result
      }));

      return result;
    } catch (err) {
      console.error("Fetch error:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const prefetchData = async (page) => {
    if (!cachedData[page] && page > 0) {
      try {
        await fetchData(page);
      } catch (error) {
        console.error(`Prefetch error for page ${page}:`, error);
      }
    }
  };

  useEffect(() => {
    const loadCurrentPage = async () => {
      try {
        const result = await fetchData(currentPage);
        setData(result);
        setTotalItems(result.pagination.total_items);
        
        prefetchData(currentPage + 1);
        prefetchData(currentPage - 1);
      } catch (err) {
        setError(err.message);
      }
    };

    loadCurrentPage();
  }, [currentPage]);

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
    if (change === 'new' || change === '-') {
      return <MinusCircle className="inline text-gray-500 w-4 h-4" />;
    }
    return change.startsWith('↑') ? 
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

  if (!data || !data.items) {
    return null;
  }

  const formatNumber = num => new Intl.NumberFormat('ja-JP').format(num);

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
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
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
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
                      <>
                        {getRankChangeIcon(channel.rank_change)}
                        <span className="ml-1">{channel.rank_change}</span>
                      </>
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
