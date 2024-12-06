import React, { useEffect, useState } from 'react';

function YoutubeRanking() {
  const [rankingData, setRankingData] = useState(null);
  const [sortKey, setSortKey] = useState('current_rank');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filters, setFilters] = useState({
    subscriber_min: 0,
    subscriber_max: Infinity,
    views_min: 0,
    views_max: Infinity
  });

  useEffect(() => {
    fetch('https://youtube-research.s3.ap-southeast-2.amazonaws.com/processed/latest_comparison.json')
      .then(res => res.json())
      .then(data => setRankingData(data))
      .catch(err => console.error('データ取得エラー:', err));
  }, []);

  if (!rankingData) return <div>Loading...</div>;

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // フィルタリングとソートを適用したデータ
  const filteredAndSortedData = rankingData.comparison.changes
    .filter(channel => (
      channel.current_stats.subscriber_count >= filters.subscriber_min &&
      channel.current_stats.subscriber_count <= filters.subscriber_max &&
      channel.current_stats.monthly_views >= filters.views_min &&
      channel.current_stats.monthly_views <= filters.views_max
    ))
    .sort((a, b) => {
      let compareA, compareB;
      switch (sortKey) {
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
          return 0;
      }
      return sortOrder === 'asc' ? compareA - compareB : compareB - compareA;
    });

  return (
    <div>
      <h1>YouTubeチャンネルランキング</h1>
      <p>総チャンネル数: {rankingData.metadata.total_channels}</p>

      {/* フィルター設定 */}
      <div style={{ marginBottom: '20px' }}>
        <div>
          登録者数: 
          <input 
            type="number" 
            placeholder="最小値"
            onChange={e => setFilters({...filters, subscriber_min: Number(e.target.value) || 0})}
          />
          〜
          <input 
            type="number"
            placeholder="最大値"
            onChange={e => setFilters({...filters, subscriber_max: Number(e.target.value) || Infinity})}
          />
        </div>
        <div>
          月間再生数: 
          <input 
            type="number"
            placeholder="最小値"
            onChange={e => setFilters({...filters, views_min: Number(e.target.value) || 0})}
          />
          〜
          <input 
            type="number"
            placeholder="最大値"
            onChange={e => setFilters({...filters, views_max: Number(e.target.value) || Infinity})}
          />
        </div>
      </div>

      <table border="1" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th onClick={() => handleSort('current_rank')} style={{ cursor: 'pointer' }}>
              順位 {sortKey === 'current_rank' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
            </th>
            <th>チャンネル</th>
            <th onClick={() => handleSort('subscriber_count')} style={{ cursor: 'pointer' }}>
              登録者数 {sortKey === 'subscriber_count' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
            </th>
            <th onClick={() => handleSort('monthly_views')} style={{ cursor: 'pointer' }}>
              月間再生数 {sortKey === 'monthly_views' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
            </th>
            <th>順位変動</th>
          </tr>
        </thead>
        <tbody>
          {filteredAndSortedData.map(channel => (
            <tr key={channel.youtube_url}>
              <td>{channel.current_rank}</td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <img 
                    src={channel.icon_url} 
                    alt="" 
                    style={{ width: '30px', height: '30px', marginRight: '10px', borderRadius: '50%' }}
                  />
                  <a href={channel.youtube_url} target="_blank" rel="noopener noreferrer">
                    {channel.channel_name}
                  </a>
                </div>
              </td>
              <td style={{ textAlign: 'right' }}>{channel.current_stats.subscriber_count.toLocaleString()}</td>
              <td style={{ textAlign: 'right' }}>{channel.current_stats.monthly_views.toLocaleString()}</td>
              <td style={{ textAlign: 'center' }}>{channel.rank_change_text}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default YoutubeRanking;
