import React from 'react';
import { TrendingUp, Zap } from 'lucide-react';

/**
 * A card component to display the price of a specific metal purity.
 *
 * @param {object} props
 * @param {string} props.purity - The purity level (e.g., "24K Gold").
 * @param {number} props.pricePerGram - The price per gram.
 * @param {string} props.highlightColor - The Tailwind CSS color class for highlights (e.g., "text-yellow-500").
 */
const PriceCard = ({ purity, pricePerGram, highlightColor = 'text-gray-800' }) => {
    const pricePer10Grams = pricePerGram * 10;

    // Formatter for Indian currency
    const formatCurrency = (value) => {
        if (typeof value !== 'number' || isNaN(value)) {
            return '...';
        }
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 border-t-4 border-yellow-400 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between mb-2">
                <h3 className={`text-lg font-semibold ${highlightColor}`}>{purity}</h3>
                <TrendingUp className={`w-5 h-5 ${highlightColor}`} />
            </div>
            <div className="my-4">
                <p className="text-3xl sm:text-4xl font-bold text-gray-900">
                    {formatCurrency(pricePerGram)}
                </p>
                <p className="text-sm text-gray-500">per gram</p>
            </div>
            <div className="border-t border-gray-100 pt-3">
                <p className="text-md font-medium text-gray-700">
                    {formatCurrency(pricePer10Grams)}
                    <span className="text-xs text-gray-500"> / 10 grams</span>
                </p>
            </div>
        </div>
    );
};

export default PriceCard;