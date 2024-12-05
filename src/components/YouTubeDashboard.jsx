import React, { useState, useEffect } from 'react';

const YouTubeDashboard = () => {
  const [allData, setAllData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
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
      setAllData({
        items: data.items,
        total: data.pagination.total_items
      });
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

  if (!allData || !allData.items) return null;

  const currentItems = allData.items.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(allData.items.length / itemsPerPage);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">YouTubeチャンネルランキング</h1>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">順位</th>
              <th className="px-4 py-2 text-left">チャンネル</th>
              <th className="px-4 py-2 text-right">登録者数</th>
              <th className="px-4 py-2 text-right">月間再生回数</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((channel) => (
              <tr key={channel.youtube_url} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">{channel.rank}</td>
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
