import React, { useEffect, useState } from 'react';

function YoutubeRanking() {
  const [rankingData, setRankingData] = useState(null);

  useEffect(() => {
    fetch('https://youtube-research.s3.ap-southeast-2.amazonaws.com/processed/latest_comparison.json')
      .then(res => res.json())
      .then(data => {
        console.log('データ取得成功:', data);
        setRankingData(data);
      })
      .catch(err => {
        console.error('データ取得エラー:', err);
      });
  }, []);

  if (!rankingData) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>YouTubeチャンネルランキング</h1>
      <p>総チャンネル数: {rankingData.metadata.total_channels}</p>
      <table border="1">
        <thead>
          <tr>
            <th>順位</th>
            <th>チャンネル名</th>
            <th>登録者数</th>
          </tr>
        </thead>
        <tbody>
          {rankingData.comparison.changes.slice(0, 10).map(channel => (
            <tr key={channel.youtube_url}>
              <td>{channel.current_rank}</td>
              <td>{channel.channel_name}</td>
              <td>{channel.current_stats.subscriber_count.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default YoutubeRanking;
