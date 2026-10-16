'use client';

import React, { useEffect, useState } from 'react';
import { Scissors, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProviderStore } from '@/store/providerStore';
import { LookupsService } from '@/integration/services/provider/lookupsService';
import { ServiceProvider } from '@/integration/services/provider/providerService';
import type { LookupItemDto } from '@/integration/services/provider/lookups.types';
import { pickLocalized } from '@/integration/services/provider/lookups.helpers';

type Props = {
  onSelect?: (id: string) => void; 
};

export const ServiceTypeSelector = ({ onSelect }: Props) => {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en';
  const { activityTypeId, setActivityTypeId } = useProviderStore();
  const [services, setServices] = useState<LookupItemDto[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null); 

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const providerTypes = await LookupsService.getByKey('PROVIDER_TYPE');
        setServices(providerTypes.filter((t) => t.isActive !== false));
      } catch (error) {
        console.error("Error fetching lookup services:", error);
      }
    };
    fetchServices();
  }, []);

  const handleSelect = async (id: string) => {
    setLoadingId(id); 
    try {
    
      await ServiceProvider.updateProfile({ type: id });

      setActivityTypeId(id);
      onSelect?.(id);
    } catch (error) {
      console.error("Failed to update provider type:", error);
    } finally {
      setLoadingId(null); 
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {services.map((service) => (
        <div key={service._id} className="flex justify-center">
          <TypeServiceCard
            title={pickLocalized(service.name, lang) || service.code || 'Unknown'}
            isActive={activityTypeId === service._id}
            isDimmed={activityTypeId !== null && activityTypeId !== service._id}
            isLoading={loadingId === service._id} 
            onClick={() => handleSelect(service._id)}
            className="p-4 w-full"
          />
        </div>
      ))}
    </div>
  );
};


type TypeServiceCardProps = {
  title: string;
  className?: string;
  isActive?: boolean;
  isDimmed?: boolean;
  isLoading?: boolean; 
  onClick?: () => void;
};

const TypeServiceCard = ({
  title,
  className = '',
  isActive = false,
  isDimmed = false,
  isLoading = false,
  onClick,
}: TypeServiceCardProps) => {
  return (
    <div
      onClick={!isLoading ? onClick : undefined}
      className={`
        flex flex-col items-center justify-center rounded-xl transition-all 
        ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}
        ${className}
        bg-white
        ${isDimmed ? 'opacity-40' : 'opacity-100'}
      `}
    >
      <div
        className={`
          flex items-center justify-center w-16 h-16 mb-3 rounded-full transition-colors
          ${isActive ? 'bg-[#E6F0E3]' : 'bg-gray-100'}
        `}
      >
        {isLoading ? (
          <Loader2 className="animate-spin text-[#79A66B]" size={28} />
        ) : (
          <Scissors
            size={28}
            className={`
              rotate-45 transition-colors
              ${isActive ? 'text-[#79A66B]' : 'text-gray-500'}
            `}
          />
        )}
      </div>

      <h3
        className={`
          text-sm font-semibold transition-colors
          ${isActive ? 'text-gray-900' : 'text-gray-400'}
        `}
      >
        {title}
      </h3>
    </div>
  );
};

export default TypeServiceCard;