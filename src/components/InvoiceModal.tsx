import React, { useState, useRef } from 'react';
import { Order } from '../types';
import { X, Upload, FileText, Check, Trash2, Loader2, AlertCircle, FileImage } from 'lucide-react';

interface InvoiceModalProps {
  isOpen: boolean;
  order: Order | null;
  selectedOrders?: Order[];
  onClose: () => void;
  onConfirmInvoice: (
    orderIds: string[], 
    invoiceData: { 
      title: string; 
      taxId: string; 
      email?: string; 
      fileUrl: string; 
    }
  ) => void;
  mode?: 'auto' | 'manual';
}

export default function InvoiceModal({ isOpen, order, selectedOrders = [], onClose, onConfirmInvoice, mode = 'auto' }: InvoiceModalProps) {
  const isBatch = selectedOrders.length > 0;
  if (!isOpen || (!order && !isBatch)) return null;

  const activeOrders = isBatch ? selectedOrders : (order ? [order] : []);
  const totalAmountSum = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const displayOrderIds = isBatch ? `批量开票 (${activeOrders.length} 笔订单: ${activeOrders.map(o => o.id).slice(0, 2).join(', ')}${activeOrders.length > 2 ? '...' : ''})` : (order?.id || '');

  // Form State
  const [title, setTitle] = useState('');
  const [taxId, setTaxId] = useState('');
  const [email, setEmail] = useState('');
  
  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Quick suggestions for invoice title search
  const suggestions = [
    '北京西恩贝美容有限公司',
    '上海西恩贝商贸有限公司',
    '深圳西恩贝科技开发有限公司',
    '广州西恩贝健康管理咨询有限公司'
  ];
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndUploadFile(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndUploadFile(e.target.files[0]);
    }
  };

  // Validate file type & size and upload to server
  const validateAndUploadFile = (selectedFile: File) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    const fileExt = selectedFile.name.split('.').pop()?.toLowerCase() || '';
    const isValidType = validTypes.includes(selectedFile.type) || ['jpg', 'jpeg', 'png', 'pdf'].includes(fileExt);

    if (!isValidType) {
      setUploadError('仅支持上传 JPG, PNG 或 PDF 格式的文件！');
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
      setUploadError('文件大小不能超过 10MB！');
      return;
    }

    setFile(selectedFile);
    setUploadError(null);
    uploadFileToServer(selectedFile);
  };

  // Real upload to Node/Express backend
  const uploadFileToServer = async (selectedFile: File) => {
    setUploading(true);
    setUploadProgress(10);
    
    // Simulating progress steps for smooth visual experience
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 15;
      });
    }, 150);

    try {
      const formData = new FormData();
      formData.append('invoiceFile', selectedFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('服务器上传失败，请稍后重试');
      }

      const data = await response.json();
      
      if (data.success) {
        setUploadProgress(100);
        setFileUrl(data.fileUrl);
      } else {
        throw new Error(data.error || '上传失败');
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      setUploadError(err.message || '上传过程中发生错误');
      setFile(null);
      setFileUrl('');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileUrl('');
    setUploadProgress(0);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit invoice confirmation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('请填写发票抬头');
      return;
    }
    if (!taxId.trim()) {
      alert('请填写税号');
      return;
    }
    
    const finalFileUrl = mode === 'auto'
      ? 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
      : fileUrl;

    if (!finalFileUrl) {
      alert('请先上传发票文件');
      return;
    }

    onConfirmInvoice(activeOrders.map(o => o.id), {
      title: title.trim(),
      taxId: taxId.trim(),
      email: email.trim() || undefined,
      fileUrl: finalFileUrl
    });
    
    // Reset state on success
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setTaxId('');
    setEmail('');
    setFile(null);
    setFileUrl('');
    setUploadProgress(0);
    setUploadError(null);
  };

  const isPdf = file?.name?.toLowerCase().endsWith('.pdf') || fileUrl.toLowerCase().endsWith('.pdf');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 select-none backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-[520px] max-w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150 border border-slate-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="font-bold text-slate-800 text-[16px]">
            <span>{isBatch ? '批量开具发票' : '开具发票'}</span>
          </div>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }} 
            type="button"
            className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer p-1 hover:bg-slate-100 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden text-[13px] text-slate-600">
          {/* Scrollable fields area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Invoice Title * required */}
          <div className="space-y-1 relative">
            <label className="block text-slate-700 font-semibold">
              <span className="text-red-500 mr-1">*</span>发票抬头
            </label>
            <input
              type="text"
              required
              placeholder="请输入发票抬头 (可搜索)"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setShowSuggestions(e.target.value.length > 0);
              }}
              onFocus={() => {
                if (title.length > 0) setShowSuggestions(true);
              }}
              className="w-full border border-slate-200 rounded-lg px-3.5 py-2 text-slate-800 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
            />
            
            {/* Suggestions Dropdown */}
            {showSuggestions && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden max-h-40 overflow-y-auto">
                {suggestions
                  .filter((s) => s.includes(title))
                  .map((s, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setTitle(s);
                        setShowSuggestions(false);
                      }}
                      className="px-3.5 py-2 hover:bg-slate-50 text-slate-700 cursor-pointer border-b border-slate-50 last:border-b-0"
                    >
                      {s}
                    </div>
                  ))}
                {suggestions.filter((s) => s.includes(title)).length === 0 && (
                  <div className="px-3.5 py-2 text-slate-400 italic">未找到匹配的抬头，直接回车使用输入内容</div>
                )}
              </div>
            )}
          </div>

          {/* Tax ID * required */}
          <div className="space-y-1">
            <label className="block text-slate-700 font-semibold">
              <span className="text-red-500 mr-1">*</span>税号
            </label>
            <input
              type="text"
              required
              placeholder="请输入税号 (如果是个人，请输入手机号码)"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3.5 py-2 text-slate-800 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
            />
          </div>

          {/* Email optional */}
          <div className="space-y-1">
            <label className="block text-slate-700 font-semibold">电子邮箱地址</label>
            <input
              type="email"
              placeholder="请输入电子邮箱 (将自动发送下载链接)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3.5 py-2 text-slate-800 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
            />
          </div>

          {/* Read Only/Static Info Grid */}
          <div className="grid grid-cols-2 gap-4 border border-slate-100 rounded-xl p-4 bg-slate-50/50">
            <div className="space-y-0.5">
              <span className="text-slate-400 block text-xs">发票类型</span>
              <span className="text-slate-800 font-semibold text-xs">增值税普通发票(数电发票)</span>
            </div>
            <div className="space-y-0.5 text-right">
              <span className="text-slate-400 block text-xs">开票金额</span>
              <span className="text-red-500 font-bold text-sm notranslate" translate="no">¥{totalAmountSum.toFixed(2)}</span>
            </div>
            <div className="col-span-2 space-y-0.5 pt-2 border-t border-slate-100">
              <span className="text-slate-400 block text-xs">订单编号</span>
              <span className="text-slate-700 font-mono font-medium truncate block max-w-full" title={displayOrderIds}>{displayOrderIds}</span>
            </div>
          </div>

          {/* Invoice File Upload Area */}
          {mode === 'manual' && (
            <div className="space-y-1.5">
              <label className="block text-slate-700 font-semibold">
                <span className="text-red-500 mr-1">*</span>上传发票文件
                <span className="text-slate-400 font-normal text-xs ml-2">(仅支持 JPG, PNG, PDF，最大 10MB)</span>
              </label>

              {/* Drag & Drop Box */}
              {!file && !fileUrl ? (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150 ${
                    dragActive 
                      ? 'border-blue-500 bg-blue-50/40' 
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/jpeg,image/png,application/pdf"
                    className="hidden"
                  />
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-slate-700 font-semibold mb-1">拖拽发票文件至此，或点击上传</p>
                  <p className="text-slate-400 text-xs">支持单张 JPG / PNG 图片或单个 PDF 文档</p>
                </div>
              ) : (
                /* Selected / Uploaded File Box */
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 border border-blue-100">
                      {isPdf ? (
                        <FileText className="w-5 h-5" />
                      ) : (
                        <FileImage className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-slate-800 font-semibold truncate text-[12px] max-w-[280px]" title={file?.name || 'Uploaded Invoice'}>
                        {file?.name || `invoice-${activeOrders[0]?.id || 'batch'}.${isPdf ? 'pdf' : 'png'}`}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {uploading ? (
                          <div className="flex items-center gap-1.5 text-blue-600 text-[11px] font-medium">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>正在上传至服务器... {uploadProgress}%</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-emerald-600 text-[11px] font-medium">
                            <Check className="w-3.5 h-3.5" />
                            <span>文件已成功保存至服务器</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* File actions */}
                  {!uploading && (
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                      title="删除并重新选择"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Error Message */}
              {uploadError && (
                <div className="flex items-center gap-2 text-red-500 font-medium text-xs mt-1 bg-red-50 p-2.5 rounded-lg border border-red-100 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}
        </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/30 shrink-0">
            <button
              type="button"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="px-5 py-2 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={uploading || (mode === 'manual' && !fileUrl) || !title.trim() || !taxId.trim()}
              className={`px-5 py-2 text-xs font-semibold text-white border rounded-lg shadow-sm transition-colors flex items-center gap-1.5 ${
                uploading || (mode === 'manual' && !fileUrl) || !title.trim() || !taxId.trim()
                  ? 'bg-slate-300 border-slate-300 cursor-not-allowed text-slate-500'
                  : 'bg-blue-600 border-blue-600 hover:bg-blue-700 active:bg-blue-800 cursor-pointer'
              }`}
            >
              {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>确认开票</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
