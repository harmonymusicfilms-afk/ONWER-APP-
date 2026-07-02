/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Briefcase,
  Plus,
  Clock,
  ChevronLeft,
  X,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Info
} from 'lucide-react';
import { dbMock } from '../lib/dbMock';
import { Service, Shop } from '../types';

interface ServicesProps {
  shop: Shop;
  screenMode: 'list' | 'add_edit';
  selectedServiceData?: Service | null;
  onNavigateTo: (screen: string, extraData?: any) => void;
}

export default function Services({ shop, screenMode, selectedServiceData, onNavigateTo }: ServicesProps) {
  const [services, setServices] = useState<Service[]>([]);

  // Form states
  const [name, setName] = useState('');
  const [durationMins, setDurationMins] = useState(30);
  const [price, setPrice] = useState(250);
  const [category, setCategory] = useState('Hair');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState('');

  // Toast
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' });

  const triggerToast = (msg: string) => {
    setToast({ show: true, msg });
    setTimeout(() => setToast({ show: false, msg: '' }), 3000);
  };

  const loadData = () => {
    const list = dbMock.getServices(shop.id);
    setServices(list);

    if (screenMode === 'add_edit' && selectedServiceData) {
      setName(selectedServiceData.name);
      setDurationMins(selectedServiceData.duration_mins);
      setPrice(selectedServiceData.price);
      setCategory(selectedServiceData.category);
      setIsActive(selectedServiceData.is_active);
    } else if (screenMode === 'add_edit') {
      // Clear form
      setName('');
      setDurationMins(30);
      setPrice(200);
      setCategory('Hair');
      setIsActive(true);
    }
  };

  useEffect(() => {
    loadData();
  }, [shop.id, selectedServiceData, screenMode]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category) {
      setError('Service name is mandatory (सेवा का नाम आवश्यक है)');
      return;
    }
    setError('');

    try {
      dbMock.saveService(shop.id, {
        id: selectedServiceData?.id,
        name: name.trim(),
        duration_mins: durationMins,
        price,
        category,
        is_active: isActive
      });

      triggerToast(selectedServiceData ? 'Service updated!' : 'Service created successfully!');

      setTimeout(() => {
        onNavigateTo('profile'); // Services list is hosted in profile screen transitions
      }, 800);
    } catch (err) {
      setError('Could not save service. Please try again.');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      dbMock.deleteService(shop.id, id);
      triggerToast('Service deleted');
      loadData();
    }
  };

  const handleToggleActive = (service: Service) => {
    try {
      dbMock.saveService(shop.id, {
        ...service,
        is_active: !service.is_active
      });
      loadData();
      triggerToast(`${service.name} status updated!`);
    } catch (err) {
      triggerToast('Error toggling state');
    }
  };

  return (
    <div className="flex flex-col min-h-[580px] bg-slate-50 pb-20 relative overflow-y-auto">
      {/* Toast Notification */}
      {toast.show && (
        <div className="absolute top-4 left-4 right-4 z-50 bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 border border-slate-800 animate-slide-in">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          {toast.msg}
        </div>
      )}

      {/* 1. SERVICES LIST SCREEN */}
      {screenMode === 'list' && (
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center mt-2">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Services Catalog (सेवा सूची)</h2>
              <p className="text-xs text-slate-500">Configure prices and times of your services</p>
            </div>
            <button
              onClick={() => onNavigateTo('service_add_edit')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center gap-1 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Service
            </button>
          </div>

          <div className="space-y-3">
            {services.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center flex flex-col items-center">
                <Briefcase className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-600">No services cataloged</p>
                <p className="text-xs text-slate-400 mt-0.5">Add basic services to start receiving client selections.</p>
              </div>
            ) : (
              services.map(srv => (
                <div
                  key={srv.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex justify-between items-center hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-slate-100 rounded-xl text-slate-600 flex-shrink-0">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="inline-block text-[9px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded uppercase mb-1">
                        {srv.category}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900">{srv.name}</h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                        <span className="font-extrabold text-slate-800">₹{srv.price}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {srv.duration_mins} mins
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Toggle activation */}
                    <button
                      onClick={() => handleToggleActive(srv)}
                      className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {srv.is_active ? (
                        <ToggleRight className="w-7 h-7 text-blue-600" />
                      ) : (
                        <ToggleLeft className="w-7 h-7 text-slate-300" />
                      )}
                    </button>

                    <button
                      onClick={() => onNavigateTo('service_add_edit', srv)}
                      className="p-1.5 bg-slate-50 rounded-lg text-slate-500 hover:bg-slate-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(srv.id)}
                      className="p-1.5 bg-red-50 rounded-lg text-red-500 hover:bg-red-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 2. ADD/EDIT SERVICE SCREEN */}
      {screenMode === 'add_edit' && (
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => onNavigateTo('profile')}
              className="p-1.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {selectedServiceData ? 'Edit Service' : 'Add New Service (नया सर्विस जोड़ें)'}
              </h2>
              <p className="text-xs text-slate-500">Configure prices, categories, and times</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            {error && (
              <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 mb-4 font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Service Name (सर्विस का नाम) *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Classic Haircut & Styling"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Price (कीमत ₹) *
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={e => setPrice(Number(e.target.value))}
                    placeholder="250"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Duration (मिनटों में) *
                  </label>
                  <select
                    value={durationMins}
                    onChange={e => setDurationMins(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  >
                    <option value={15}>15 mins</option>
                    <option value={20}>20 mins</option>
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>60 mins (1 hr)</option>
                    <option value={90}>90 mins</option>
                    <option value={120}>120 mins (2 hrs)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Category (श्रेणी) *
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                >
                  <option value="Hair">Hair Grooming</option>
                  <option value="Beard">Beard Grooming</option>
                  <option value="Facial">Skin & Facial</option>
                  <option value="Therapy">Therapy Sessions</option>
                  <option value="Massage">Wellness Massage</option>
                  <option value="Nails">Pedicure/Nails</option>
                </select>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <input
                  type="checkbox"
                  id="srv-is-active"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <label htmlFor="srv-is-active" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                  Make service active and available for booking
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-3.5 rounded-xl shadow transition-colors"
              >
                Save Service Details (सुरक्षित करें)
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
