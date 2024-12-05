import React, { useState, useEffect } from 'react';

const YouTubeDashboard = () => {
  const [allData, setAllData] = useState(null);
  const [displayData, setDisplayData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItems, setSelectedItems] = useState(() => {
    const saved = localStorage.getItem('selectedYoutubeChannels');
    return saved ? JSON.parse(saved) : [];
  });
  const [filters, setFilters] = useState({
    subscriberMin: '',
    subscriberMax: '',
    viewsMin: '',
    viewsMax: ''
  });

  const itemsPerPage = 20;

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        'https://m4ks023065.execute-api.ap-southeast-2.amazonaws.com/prod/get-youtube-rankings-dynamodb?page=1'
      );
      
      if (!response.ok) {
        throw new Error('データの取得に失敗しました');
      }

      const jsonData = await response.json();
      const data = typeof jsonData.body === 'string' ? JSON.parse(jsonData.body) : jsonData.body;
      setAllData(data);
      setDisplayData(data.items);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    localStorage.setItem('selectedYoutubeChannels', JSON.stringify(selectedItems));
  }, [selectedItems]);

  const handleSelect = (youtubeUrl) => {
    setSelectedItems(prev => 
      prev.includes(youtubeUrl) 
        ? prev.filter(url => url !== youtubeUrl)
        : [...prev, youtubeUrl]
    );
  };

  const applyFilters = () => {
    if (!allData) return;

    let filtered = allData.items.filter(item => {
      const subscriber = parseInt(item.subscriber_count.replace(/,/g, ''));
      const views = parseInt(item.monthly_views.replace(/,/g, ''));
      
      const meetsSubscriberMin = !filters.subscriberMin || subscriber >= parseInt(filters.subscriberMin);
      const meetsSubscriberMax = !filters.subscriberMax || subscriber <= parseInt(filters.subscriberMax);
      const meetsViewsMin = !filters.viewsMin || views >= parseInt(filters.viewsMin);
      const meetsViewsMax = !filters.viewsMax || views <= parseInt(filters.viewsMax);

      return meetsSubscriberMin && meetsSubscriberMax && meetsViewsMin && meetsViewsMax;
    });

    setDisplayData(filtered);
    setCurrentPage(1);
  };

  const handleCSVDownload = () => {
    if (!displayData) return;

    const selectedChannels = displayData.filter(channel => 
      selectedItems.includes(channel.youtube_url)
    );

    const csvContent = [
      ['チャンネル名', 'チャンネルURL', '再生数', 'ランキング'].join(','),
      ...selectedChannels.map(channel => [
        `"${channel.channel_name}"`,
        channel.youtube_url,
        channel.monthly_views,
        channel.rank
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'youtube_channels.csv';
    link.click();
  };

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">データを読み込み中...</div>;
  }

  if (error) {
    return (
      <div className="p-6 max-w-2xl mx-auto bg-red-50 border-l-4 border-red-500">
        <h3 className="text-red-800 font-medium">エラーが発生しました</h3>
        <p className="text-red-700">{error}</p>
        <button onClick={fetchData} className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 font-semibold py-2 px-4 rounded">
          再試行
        </button>
      </div>
    );
  }

  if (!displayData) return null;

  const currentItems = displayData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(displayData.length / itemsPerPage);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">YouTubeチャンネルランキング</h1>
      
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <h2 className="text-lg font-bold mb-4">フィルター</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">チャンネル登録者数</h3>
            <div className="flex gap-2 items-center">
              <input 
                type="number" 
                placeholder="最小値"
                value={filters.subscriberMin}
                onChange={(e) => setFilters(prev => ({ ...prev, subscriberMin: e.target.value }))}
                className="w-32 px-2 py-1 border rounded"
              />
              <span>～</span>
              <input 
                type="number" 
                placeholder="最大値"
                value={filters.subscriberMax}
                onChange={(e) => setFilters(prev => ({ ...prev, subscriberMax: e.target.value }))}
                className="w-32 px-2 py-1 border rounded"
              />
              <span>人</span>
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-2">月間再生回数</h3>
            <div className="flex gap-2 items-center">
              <input 
                type="number" 
                placeholder="最小値"
                value={filters.viewsMin}
                onChange={(e) => setFilters(prev => ({ ...prev, viewsMin: e.target.value }))}
                className="w-32 px-2 py-1 border rounded"
              />
              <span>～</span>
              <input 
                type="number" 
                placeholder="最大値"
                value={filters.viewsMax}
                onChange={(e) => setFilters(prev => ({ ...prev, viewsMax: e.target.value }))}
                className="w-32 px-2 py-1 border rounded"
              />
              <span>回</span>
            </div>
          </div>
        </div>
        <button 
          onClick={applyFilters}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          フィルターを適用
        </button>
      </div>

      <div className="mb-4">
        <button 
          onClick={handleCSVDownload}
          disabled={selectedItems.length === 0}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50 hover:bg-green-600"
        >
          選択項目をCSVダウンロード
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">選択</th>
              <th className="px-4 py-2 text-left">順位</th>
              <th className="px-4 py-2 text-left">チャンネル</th>
              <th className="px-4 py-2 text-right">登録者数</th>
              <th className="px-4 py-2 text-right">月間再生回数</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((channel) => (
              <tr key={channel.youtube_url} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">
                  <input 
                    type="checkbox"
                    checked={selectedItems.includes(channel.youtube_url)}
                    onChange={() => handleSelect(channel.youtube_url)}
                    className="w-4 h-4"
                  />
                </td>
                <td className="px-4 py-2">
                  {channel.rank}
                  <span className="ml-1">
                    {channel.rank_change === 'new' ? 
                      <span className="text-blue-500">NEW</span> :
                      channel.rank_change > 0 ? 
                        <span className="text-red-500">↓{channel.rank_change}</span> :
                      channel.rank_change < 0 ? 
                        <span className="text-green-500">↑{Math.abs(channel.rank_change)}</span> :
                        null
                    }
                  </span>
                </td>
                <td className="px-4 py-2">
                  <a 
                    href={channel.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:underline"
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
                <td className="px-4 py-2 text-right">
                  {new Intl.NumberFormat('ja-JP').format(channel.subscriber_count)}
                </td>
                <td className="px-4 py-2 text-right">
                  {new Intl.NumberFormat('ja-JP').format(channel.monthly_views)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex justify-center gap-2">
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          前へ
        </button>
        <span className="px-4 py-2">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          次へ
        </button>
      </div>
    </div>
  );
};

export default YouTubeDashboard;
