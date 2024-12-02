import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ReloadIcon } from '@radix-ui/react-icons';

const YouTubeDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('https://m4ks023065.execute-api.ap-southeast-2.amazonaws.com/prod/comparison', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // 必要に応じて追加のヘッダーを設定
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const jsonData = await response.json();
      setData(jsonData);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto my-4">
        <CardContent className="flex items-center justify-center p-6">
          <ReloadIcon className="h-6 w-6 animate-spin mr-2" />
          <p>データを読み込み中...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="w-full max-w-4xl mx-auto my-4">
        <AlertDescription>
          データの取得中にエラーが発生しました: {error}
          <button
            onClick={fetchData}
            className="ml-4 px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200"
          >
            再試行
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto my-4">
      <CardHeader>
        <CardTitle>YouTubeチャンネルランキング</CardTitle>
      </CardHeader>
      <CardContent>
        {/* データ表示のロジックをここに実装 */}
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify(data, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
};

export default YouTubeDashboard;
