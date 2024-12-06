import React, { useState, useEffect } from 'react';

function YoutubeRanking() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('https://youtube-research.s3.ap-southeast-2.amazonaws.com/processed/latest_comparison.json')
      .then(response => response.json())
      .then(json => {
        console.log('取得したデータ:', json);  // デバッグ用
        setData(json);
      })
      .catch(error => {
        console.error('エラー:', error);  // エラー確認用
      });
  }, []);

  // データの中身を確認
  console.log('現在のデータ:', data);

  if (!data) return <div>Loading...</div>;

  // データの構造を確認
  console.log('comparison:', data.comparison);

  return (
    <div>
      <h1>YouTubeチャンネルランキング</h1>
      <p>総チャンネル数: {data?.metadata?.total_channels}</p>
      <table>
        <thead>
          <tr>
            <th>順位</th>
            <th>チャンネル名</th>
            <th>登録者数</th>
          </tr>
        </thead>
        <tbody>
          {data?.comparison?.map(item => (
            <tr key={item.youtube_url}>
              <td>{item.current_rank}</td>
              <td>{item.channel_name}</td>
              <td>{item.current_stats.subscriber_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default YoutubeRanking;
