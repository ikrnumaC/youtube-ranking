import React, { useEffect, useState } from 'react';

function YoutubeRanking() {
  const [rankingData, setRankingData] = useState(null);
  const [sortKey, setSortKey] = useState('current_rank');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedChannels, setSelectedChannels] = useState(new Set());  // 追加
  const [filters, setFilters] = useState({
    subscriber_min: 0,
    subscriber_max: Infinity,
    views_min: 0,
    views_max: Infinity
  });

  // ... 既存のuseEffectとhandleSort

  // テーブル部分のみ変更
  return (
    <div>
      <h1>YouTubeチャンネルランキング</h1>
      <p>総チャンネル数: {rankingData.metadata.total_channels}</p>
      <p>選択中: {selectedChannels.size}件</p>

      {/* 既存のフィルター部分 */}
      <div style={{ marginBottom: '20px' }}>
        // ... 既存のフィルター
      </div>

      <table border="1" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>
              <input 
                type="checkbox"
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedChannels(new Set(filteredAndSortedData.map(c => c.youtube_url)));
                  } else {
                    setSelectedChannels(new Set());
                  }
                }}
                checked={selectedChannels.size === filteredAndSortedData.length && filteredAndSortedData.length > 0}
              />
            </th>
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
              <td>
                <input
                  type="checkbox"
                  checked={selectedChannels.has(channel.youtube_url)}
                  onChange={() => {
                    const newSelected = new Set(selectedChannels);
                    if (selectedChannels.has(channel.youtube_url)) {
                      newSelected.delete(channel.youtube_url);
                    } else {
                      newSelected.add(channel.youtube_url);
                    }
                    setSelectedChannels(newSelected);
                  }}
                />
              </td>
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
