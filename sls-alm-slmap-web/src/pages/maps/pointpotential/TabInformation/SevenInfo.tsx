import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '../../../../components';
import {
  fetchSevenInfoByPoiId,
  type SevenInfoResponse,
} from '../../../../services/location.service';

export interface SevenInfoData {
  store_code?: string;
  store_name?: string;
  location_t?: string;
  trade_area?: string;
  branch_type?: string;
  seven_type?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  store_width?: string;
  store_length?: string;
  sale_area?: string;
  stock_area?: string;
  store_area?: string;
  store_building_type?: string;
  room_amount?: string;
  store_parking?: string;
  store_parking_motocycle?: string;
  open_date?: string;
  close_date?: string;
  office_hours?: string;
  renovate_start_date?: string;
  renovate_end_date?: string;
  tempclose_start_date?: string;
  tempclose_end_date?: string;
  sale_average?: string;
  customer_average?: string;
  sale_price_person?: string;
  opentype_amount?: string;
  vault_amount?: string;
  shelf?: string;
  pos_amount?: string;
  can_sale_cigarette?: string;
  can_sale_alcohol?: string;
}

interface SevenInfoProps {
  poiId: string;
  data?: SevenInfoData;
}

const ReadonlyInput: React.FC<{ title: string; value?: string | number }> = ({
  title,
  value,
}) => (
  <Input
    title={title}
    type="text"
    value={value ?? ''}
    disabled
    size="sm"
    className="bg-gray-50 cursor-not-allowed"
  />
);

const ReadonlyRadio: React.FC<{
  title: string;
  value?: string;
  yesLabel?: string;
  noLabel?: string;
}> = ({ title, value, yesLabel = 'ได้', noLabel = 'ไม่ได้' }) => (
  <fieldset className="fieldset pt-0">
    <legend className="fieldset-legend">{title}</legend>
    <div className="flex gap-6 pt-1 pb-1">
      <label className="flex items-center gap-2">
        <input
          type="radio"
          className="radio radio-primary radio-xs"
          checked={value === 'Y'}
          readOnly
        />
        <span className={`text-xs ${value === 'Y' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>
          {yesLabel}
        </span>
      </label>
      <label className="flex items-center gap-2">
        <input
          type="radio"
          className="radio radio-primary radio-xs"
          checked={value === 'N'}
          readOnly
        />
        <span className={`text-xs ${value === 'N' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>
          {noLabel}
        </span>
      </label>
    </div>
      </fieldset>
);

const formatNumber = (value: string | null | undefined, decimals = 0): string | undefined => {
  if (value === null || value === undefined) return undefined;
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const SevenInfo: React.FC<SevenInfoProps> = ({ poiId, data: externalData }) => {
  const { t } = useTranslation(['maps']);
  const [data, setData] = useState<SevenInfoData>(externalData ?? {});

  useEffect(() => {
    const id = parseInt(poiId);
    if (!poiId || isNaN(id)) {
      setData({});
      return;
    }
    setData({});
    fetchSevenInfoByPoiId(id)
      .then((res: SevenInfoResponse | null) => {
        if (!res) {
          setData({});
          return;
        }
        setData({
          store_code: res.storecode ?? undefined,
          store_name: res.storename ?? undefined,
          location_t: res.locationT ?? undefined,
          trade_area: res.tradeArea ?? undefined,
          branch_type: res.branchType ?? undefined,
          seven_type: res.sevenType ?? undefined,
          contract_start_date: res.contractStartDate ?? undefined,
          contract_end_date: res.contractEndDate ?? undefined,
          store_width: res.storeWidth ?? undefined,
          store_length: res.storeLength ?? undefined,
          sale_area: res.saleArea ?? undefined,
          stock_area: res.stockArea ?? undefined,
          store_area: res.storeArea ?? undefined,
          store_building_type: res.storeBuildingType ?? undefined,
          room_amount: res.roomAmount ?? undefined,
          store_parking: res.storeParking ?? undefined,
          store_parking_motocycle: res.storeParkingMotocycle ?? undefined,
          open_date: res.openDate ?? undefined,
          close_date: res.closeDate ?? undefined,
          office_hours: res.officeHours ?? undefined,
          renovate_start_date: res.renovateStartDate ?? undefined,
          renovate_end_date: res.renovateEndDate ?? undefined,
          tempclose_start_date: res.tempcloseStartDate ?? undefined,
          tempclose_end_date: res.tempcloseEndDate ?? undefined,
          sale_average: formatNumber(res.saleAverage, 2),
          customer_average: formatNumber(res.customerAverage),
          sale_price_person: formatNumber(res.salePricePerson, 2),
          opentype_amount: formatNumber(res.opentypeAmount),
          vault_amount: formatNumber(res.vaultAmount),
          shelf: formatNumber(res.shelf),
          pos_amount: formatNumber(res.posAmount),
          can_sale_cigarette: res.canSaleCigarette ?? undefined,
          can_sale_alcohol: res.canSaleAlcohol ?? undefined,
        });
      })
      .catch((err: unknown) => {
        console.error('[SevenInfo] fetch error:', err);
      });
  }, [poiId]);

  return (
    <div className="p-4 space-y-2 w-full">

      {/* row: รหัสร้าน | ชื่อสาขา */}
      <div className="grid grid-cols-2 gap-x-6">
        <ReadonlyInput title={t('seven_info_store_code', 'รหัสร้าน')} value={data.store_code} />
        <ReadonlyInput title={t('seven_info_store_name', 'ชื่อสาขา')} value={data.store_name} />
      </div>

      {/* row: ที่ตั้ง | Trade Area */}
      <div className="grid grid-cols-2 gap-x-6">
        <ReadonlyInput title={t('seven_info_location_t', 'ที่ตั้ง')} value={data.location_t} />
        <ReadonlyInput title={t('seven_info_trade_area', 'Trade Area')} value={data.trade_area} />
      </div>

      {/* row: สถานะร้าน | ประเภท PTT */}
      <div className="grid grid-cols-2 gap-x-6">
        <ReadonlyInput title={t('seven_info_branch_type', 'สถานะร้าน')} value={data.branch_type} />
        <ReadonlyInput title={t('seven_info_seven_type', 'ประเภท PTT')} value={data.seven_type} />
      </div>

      {/* row: วันที่เริ่มสัญญา | วันที่สิ้นสุดสัญญา */}
      <div className="grid grid-cols-2 gap-x-6">
        <ReadonlyInput title={t('seven_info_contract_start_date', 'วันที่เริ่มสัญญา')} value={data.contract_start_date} />
        <ReadonlyInput title={t('seven_info_contract_end_date', 'วันที่สิ้นสุดสัญญา')} value={data.contract_end_date} />
      </div>

      {/* row: ความกว้าง | ความยาว */}
      <div className="grid grid-cols-2 gap-x-6">
        <ReadonlyInput title={t('seven_info_store_width', 'ความกว้างร้าน 7-Eleven (เมตร)')} value={data.store_width} />
        <ReadonlyInput title={t('seven_info_store_length', 'ความยาวร้าน 7-Eleven (เมตร)')} value={data.store_length} />
      </div>

      {/* row: พื้นที่ขาย | พื้นที่สต๊อค | พื้นที่ร้านทั้งหมด */}
      <div className="grid grid-cols-3 gap-x-6">
        <ReadonlyInput title={t('seven_info_sale_area', 'พื้นที่ขาย (ตร.ม.)')} value={data.sale_area} />
        <ReadonlyInput title={t('seven_info_stock_area', 'พื้นที่สต๊อค (ตร.ม.)')} value={data.stock_area} />
        <ReadonlyInput title={t('seven_info_store_area', 'พื้นที่ร้าน 7-Eleven ทั้งหมด (ตร.ม.)')} value={data.store_area} />
      </div>

      {/* row: ประเภทร้าน | จำนวนคูหา */}
      <div className="grid grid-cols-2 gap-x-6">
        <ReadonlyInput title={t('seven_info_store_building_type', 'ประเภทร้าน')} value={data.store_building_type} />
        <ReadonlyInput title={t('seven_info_room_amount', 'จำนวนคูหา')} value={data.room_amount} />
      </div>

      {/* row: ที่จอดรถยนต์ | ที่จอดรถจักรยานยนต์ */}
      <div className="grid grid-cols-2 gap-x-6">
        <ReadonlyInput title={t('seven_info_store_parking', 'จำนวนที่จอดรถยนต์ (คัน)')} value={data.store_parking} />
        <ReadonlyInput title={t('seven_info_store_parking_motocycle', 'จำนวนที่จอดรถจักรยานยนต์ (คัน)')} value={data.store_parking_motocycle} />
      </div>

      {/* row: วันที่เปิด | วันที่ปิด */}
      <div className="grid grid-cols-2 gap-x-6">
        <ReadonlyInput title={t('seven_info_open_date', 'วันที่เปิด')} value={data.open_date} />
        <ReadonlyInput title={t('seven_info_close_date', 'วันที่ปิด')} value={data.close_date} />
      </div>

      {/* row: เวลาทำการ (คนเดียว) */}
      <div className="grid grid-cols-2 gap-x-6">
        <ReadonlyInput title={t('seven_info_office_hours', 'เวลาทำการ')} value={data.office_hours} />
      </div>

      {/* row: วันที่เริ่มต้น Renovate | วันสิ้นสุด Renovate */}
      <div className="grid grid-cols-2 gap-x-6">
        <ReadonlyInput title={t('seven_info_renovate_start_date', 'วันที่เริ่มต้น Renovate')} value={data.renovate_start_date} />
        <ReadonlyInput title={t('seven_info_renovate_end_date', 'วันสิ้นสุด Renovate')} value={data.renovate_end_date} />
      </div>

      {/* row: วันเริ่มปิดชั่วคราว | วันเปิดร้านหลังปิดชั่วคราว */}
      <div className="grid grid-cols-2 gap-x-6">
        <ReadonlyInput title={t('seven_info_tempclose_start_date', 'วันเริ่มปิดชั่วคราว')} value={data.tempclose_start_date} />
        <ReadonlyInput title={t('seven_info_tempclose_end_date', 'วันเปิดร้านหลังปิดชั่วคราว')} value={data.tempclose_end_date} />
      </div>

      {/* row: ยอดขายเฉลี่ย | จำนวนลูกค้า | ยอดขายต่อหัว */}
      <div className="grid grid-cols-3 gap-x-6">
        <ReadonlyInput title={t('seven_info_sale_average', 'ยอดขายเฉลี่ยรายวัน')} value={data.sale_average} />
        <ReadonlyInput title={t('seven_info_customer_average', 'จำนวนลูกค้าต่อวัน')} value={data.customer_average} />
        <ReadonlyInput title={t('seven_info_sale_price_person', 'ยอดขายต่อหัว')} value={data.sale_price_person} />
      </div>

      {/* row: Opentype | Vault | Shelf | POS */}
      <div className="grid grid-cols-4 gap-x-6">
        <ReadonlyInput title={t('seven_info_opentype_amount', 'จำนวน Opentype')} value={data.opentype_amount} />
        <ReadonlyInput title={t('seven_info_vault_amount', 'จำนวน Vault')} value={data.vault_amount} />
        <ReadonlyInput title={t('seven_info_shelf', 'จำนวน Shelf')} value={data.shelf} />
        <ReadonlyInput title={t('seven_info_pos_amount', 'จำนวนเครื่อง POS')} value={data.pos_amount} />
      </div>

      {/* row: radio บุหรี่ | radio แอลกอฮอล์ */}
      <div className="grid grid-cols-2 gap-x-6 pt-1">
        <ReadonlyRadio
          title={t('seven_info_can_sale_cigarette', 'ขายสินค้าประเภทบุหรี่')}
          value={data.can_sale_cigarette}
          yesLabel={t('seven_info_yes', 'ได้')}
          noLabel={t('seven_info_no', 'ไม่ได้')}
        />
        <ReadonlyRadio
          title={t('seven_info_can_sale_alcohol', 'ขายสินค้าแอลกอฮอล์')}
          value={data.can_sale_alcohol}
          yesLabel={t('seven_info_yes', 'ได้')}
          noLabel={t('seven_info_no', 'ไม่ได้')}
        />
      </div>

    </div>
  );
};

export default SevenInfo;
