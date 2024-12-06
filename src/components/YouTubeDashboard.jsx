import { useState, useEffect } from 'react';
const YoutubeRanking = () => {

const YoutubeRanking = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [sortKey, setSortKey] = useState('current_rank');
  const [sortOrder, setSortOrder] = useState('asc');
  const [data, setData] = useState({ comparison: [], metadata: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('https://youtube-research.s3.ap-southeast-2.amazonaws.com/processed/latest_comparison.json');
        if (!response.ok) {
          throw new Error('データの取得に失敗しました');
        }
        const jsonData = await response.json();
        setData(jsonData);
      } catch (error) {
        setError(error.message);
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const sortData = (items, key, order) => {
    return [...items].sort((a, b) => {
      let compareA, compareB;
      
      switch(key) {
        case 'current_rank':
          compareA = a.current_rank;
          compareB = b.current_rank;
          break;
        case 'subscriber_count':
          compareA = a.current_stats.subscriber_count;
          compareB = b.current_stats.subscriber_count;
          break;
        case 'monthly_views':
          compareA = a.current_stats.monthly_views;
          compareB = b.current_stats.monthly_views;
          break;
        default:
          compareA = a.current_rank;
          compareB = b.current_rank;
      }
      
      return order === 'asc' ? compareA - compareB : compareB - compareA;
    });
  };

  const handleSort = (key) => {
    const newOrder = sortKey === key && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortKey(key);
    setSortOrder(newOrder);
  };

  const totalPages = Math.ceil((data.comparison?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const sortedData = sortData(data.comparison || [], sortKey, sortOrder);
  const currentItems = sortedData.slice(startIndex, endIndex);

  if (isLoading) {
    return <div className="p-4 text-center">データを読み込み中...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-600">エラー: {error}</div>;
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">YouTubeチャンネルランキング</h2>
        <p className="text-gray-600">総チャンネル数: {data.metadata?.total_channels || 0}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-100">
              <th 
                className="cursor-pointer px-4 py-2 border" 
                onClick={() => handleSort('current_rank')}
              >
                順位 {sortKey === 'current_rank' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th className="px-4 py-2 border">チャンネル</th>
              <th 
                className="cursor-pointer px-4 py-2 border"
                onClick={() => handleSort('subscriber_count')}
              >
                登録者数 {sortKey === 'subscriber_count' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th 
                className="cursor-pointer px-4 py-2 border"
                onClick={() => handleSort('monthly_views')}
              >
                月間視聴回数 {sortKey === 'monthly_views' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
              </th>
              <th className="px-4 py-2 border">順位変動</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((item) => (
              <tr key={item.youtube_url} className="hover:bg-gray-50">
                <td className="px-4 py-2 border text-center">{item.current_rank}</td>
                <td className="px-4 py-2 border">
                  <div className="flex items-center">
                    <img 
                      src={item.icon_url} 
                      alt={item.channel_name}
                      className="w-8 h-8 rounded-full mr-2"
                    />
                    <a 
                      href={item.youtube_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {item.channel_name}
                    </a>
                  </div>
                </td>
                <td className="px-4 py-2 border text-right">
                  {item.current_stats.subscriber_count.toLocaleString()}
                </td>
                <td className="px-4 py-2 border text-right">
                  {item.current_stats.monthly_views.toLocaleString()}
                </td>
                <td className="px-4 py-2 border text-center">
                  {item.rank_change_text}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-center space-x-2">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          前へ
        </button>
        <span className="px-4 py-2">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          次へ
        </button>
      </div>
    </div>
  );
};

export default YoutubeRanking;
