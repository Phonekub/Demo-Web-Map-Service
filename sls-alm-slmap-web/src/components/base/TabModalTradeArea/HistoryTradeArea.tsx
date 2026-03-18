import { useEffect, useState } from 'react';
import { getHistoryTradeAreaById } from '../../../services/tradeArea.service';
import { useTranslation } from 'react-i18next';

interface HistoryTradeAreaProps {
  tradeareaId: number | null;
}

export default function HistoryTradeArea({ tradeareaId }: HistoryTradeAreaProps) {
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation(['tradearea']);
  useEffect(() => {
    if (!tradeareaId) {
      setHistoryData([]);
      return;
    }
    setLoading(true);
    getHistoryTradeAreaById(tradeareaId)
      .then(res => {
        let arr: any[] = [];
        if (Array.isArray(res)) {
          arr = res;
        } else if (res?.data?.histories && Array.isArray(res.data.histories)) {
          arr = res.data.histories;
        } else if (res?.data && Array.isArray(res.data)) {
          arr = res.data;
        }
        setHistoryData(
          arr.map((item: any, idx: number) => ({
            no: idx + 1,
            status: item.wfStatus?.wfStatusName || '-',
            date: item.createDate
              ? new Date(item.createDate).toLocaleString('th-TH', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                })
              : '-',
            detail: item.remark || '-',
          }))
        );
      })
      .catch(() => setHistoryData([]))
      .finally(() => setLoading(false));
  }, [tradeareaId]);

  return (
    <div className="mx-auto">
      <div
        className="overflow-y-auto rounded-lg border border-gray-200 bg-white"
        style={{ maxHeight: 400 }}
      >
        <table className="min-w-full bg-white">
          <thead className="bg-blue-100 text-blue-700">
            <tr>
              <th className="sticky top-0 z-10 bg-blue-200 border border-gray-200 px-3 py-2 w-12 text-center">
                {t('table.no')}
              </th>
              <th className="sticky top-0 z-10 bg-blue-200 border border-gray-200 px-3 py-2 w-48 text-center">
                {t('table.status')}
              </th>
              <th className="sticky top-0 z-10 bg-blue-200 border border-gray-200 px-3 py-2 w-52 text-center">
                {t('table.effective_date')}
              </th>
              <th className="sticky top-0 z-10 bg-blue-200 border border-gray-200 px-3 py-2 w-72 text-center">
                {t('table.comments')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  className="border border-gray-200 bg-white text-center py-2 text-gray-400"
                >
                  {t('loding')}
                </td>
              </tr>
            ) : historyData.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="border border-gray-200 bg-white text-center py-2 text-gray-400"
                >
                  {t('no_data')}
                </td>
              </tr>
            ) : (
              historyData.map(row => (
                <tr key={row.no}>
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    {row.no}.
                  </td>
                  <td className="border border-gray-200 px-3 py-2">
                    {row.status || '-'}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    {row.date || '-'}
                  </td>
                  <td className="border border-gray-200 px-3 py-2 text-center">
                    {row.detail || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
