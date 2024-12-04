import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, MinusCircle, Download, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

const YouTubeDashboard = () => {
  // 基本的なstate
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cachedData, setCachedData] = useState({});
  const [totalItems, setTotalItems] = useState(0);

  // ページネーション用state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // ソートとフィルター用state
  const [sortField, setSortField] = useState('current_rank');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filters, setFilters] = useState({
    subscribersMin: '',
    subscribersMax: '',
    viewsMin: '',
    viewsMax: '',
    newOnly: false
  });

  // チェックボックス用state
  const [selectedChannels, setSelectedChannels] = useState(new Set());

  // データ取得
  const fetchData = async (page) => {
    if (cachedData[page]) {
      return cachedData[page];
    }

    try {
      const response = await fetch(
        `https://m4ks023065.execute-api.ap-southeast-2.amazonaws.com/prod/comparison?page=${page}&pageSize=${itemsPerPage}`
      );
      if (!response.ok) throw new Error('API request failed');
      const jsonData = await response.json();
      
      // キャッシュを更新
      setCachedData(prev => ({
        ...prev,
        [page]: jsonData
      }));

      // トータル件数を更新（最初のロード時のみ）
      if (page === 1 && !totalItems) {
        setTotalItems(jsonData.total || 0);
      }

      return jsonData;
    } catch (err) {
      console.error("Fetch error:", err);
      throw err;
    }
  };

  // プリフェッチ
  const prefetchData = async (page) => {
    if (!cachedData[page] && page > 0 && page <= Math.ceil(totalItems / itemsPerPage)) {
      try {
        await fetchData(page);
      } catch (error) {
        console.error(`Prefetch error for page ${page}:`, error);
      }
    }
  };

  // メインのデータ取得
  useEffect(() => {
    const loadCurrentPage = async () => {
      setIsLoading(true);
      try {
        const data = await fetchData(currentPage);
        setData(data);
        
        // 次のページと前のページをプリフェッチ
        prefetchData(currentPage + 1);
        prefetchData(currentPage - 1);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrentPage();
  }, [currentPage]);

  // ページネーションコンポーネント
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

  // 以下、既存のコンポーネントの残りの部分（テーブル、フィルター、ソート機能など）
  // ... (既存のコードをそのまま維持)

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* 既存のUIコード */}
      {/* ... */}
      
      {/* ページネーションを更新 */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            全{totalItems}件中 
            {(currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, totalItems)}件を表示
          </span>
        </div>
        <Pagination />
      </div>
    </div>
  );
};

export default YouTubeDashboard;
