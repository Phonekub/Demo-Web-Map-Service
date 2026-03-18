export interface DynamicFormRepositoryPort {
  getDynamicForm(formId: number): Promise<any>;
  getDynamicFormByReference(referenceObj: string, referenceKey: number): Promise<any>;
  getBlankForm(formConfigId: number, formVersionId: number): Promise<any>;
  findByFormId(formId: number): Promise<any>;
  findByReferenceKey(referenceObj: string, referenceKey: string): Promise<any>;
  generateFormId(): Promise<number | null>;
  createDynamicFormWithValues(data: any): Promise<any>;
  updateDynamicFormWithValues(formId: number, data: any): Promise<any>;
  getActiveFormVersion(formConfigId: number): Promise<any>;
  getActiveFormVersionByConfig(formConfigId: number): Promise<any>;
  getFormFields(formVersionId: number): Promise<any[]>;
  getFormConfigIdBySubcode(subCode: string): Promise<number | null>;
}
