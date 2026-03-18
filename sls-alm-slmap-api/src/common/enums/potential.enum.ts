export enum PotentialStatus {
  PRE_POTENTIAL = '01',
  PRE_POTENTIAL_NOT_APPROVE = '02',
  APPROVED = '03',
  NOT_APPROVE = '04',
  WAITING_APPROVE = '05',
  NETWORK_OPINION = '06',
  COMMITMENT = '07',
  RENTAL_AGREEMENT = '08',
}

export enum ApproveStatus {
  WAITING_TO_SEND_APPROVE = '1', // รอส่งอนุมัติ
  WAITING_APPROVE = '2', // รออนุมัติ
  APPROVED = '3', // อนุมัติ
  SEND_BACK_TO_EDIT = '4', // ส่งกลับแก้ไข
  NOT_APPROVE = '5', // ไม่อนุมัติ
}
