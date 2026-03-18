export interface DownloadFileDetail {
  id: number;
  file_name: string;
  file_path: string;
  uploaded_by: string;
  uploaded_at: Date;
  description?: string;
}
