import React, { useState, useEffect } from 'react';

const YouTubeDashboard = () => {
  const [data, setData] = useState({ items: [], pagination: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = async (page) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://m4ks023065.execute-api.ap-southeast-2.amazonaws.com/prod/get-youtube-rankings-dynamodb?page=${page}`
      );
      
      if (!response.ok) {
        throw new Error('データの取得に失敗しました');
      }

      const jsonData = await response.json();
      setData(jsonData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  if (isLoading) {
    return <div className="p-4">データを読み込み中...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">YouTubeチャンネルランキング</h1>
      
      {/* テーブル */}
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
            {data.items.map((channel) => (
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

      {/* ページネーション */}
      <div className="mt-6 flex justify-center gap-2">
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          前へ
        </button>
        <span className="px-4 py-2">
          {currentPage} / {data.pagination.total_pages}
        </span>
        <button
          onClick={() => setCurrentPage(p => Math.min(data.pagination.total_pages, p + 1))}
          disabled={currentPage === data.pagination.total_pages}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          次へ
        </button>
      </div>
    </div>
  );
};

export default YouTubeDashboard;
