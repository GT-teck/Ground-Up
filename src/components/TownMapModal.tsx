import React, { useState } from 'react';
import { X, MapPin, ShoppingCart, DollarSign, Car, Disc3, Sparkles, Navigation, Check } from 'lucide-react';
import { JUNKYARD_BEATERS, SPEED_STORE_ITEMS, TIRE_SHOP_ITEMS, JunkyardBeater, StorePartItem } from '../data/partsData';
import { CarPart } from '../types';
import { soundFx } from '../utils/audio';

interface TownMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  cash: number;
  onBuyPart: (item: StorePartItem) => void;
  onTowBeater: (beater: JunkyardBeater) => void;
  onSellCar: (buyerType: 'budget' | 'elite') => void;
  carCompletionPercent: number;
  initialTab?: 'junkyard' | 'parts_store' | 'tire_shop' | 'buyers';
}

export const TownMapModal: React.FC<TownMapModalProps> = ({
  isOpen,
  onClose,
  cash,
  onBuyPart,
  onTowBeater,
  onSellCar,
  carCompletionPercent,
  initialTab = 'junkyard',
}) => {
  const [activeTab, setActiveTab] = useState<'junkyard' | 'parts_store' | 'tire_shop' | 'buyers'>(initialTab);
  const [purchaseNotice, setPurchaseNotice] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const notify = (msg: string) => {
    setPurchaseNotice(msg);
    setTimeout(() => setPurchaseNotice(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none animate-fade-in">
      <div className="w-full max-w-2xl bg-[#101319] border-2 border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-black font-bold">
              <Navigation size={17} />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase font-display text-white flex items-center gap-2">
                TOWN MAP & SHOPS
                <span className="text-[10px] font-tech text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  BANKROLL: ${cash.toLocaleString()}
                </span>
              </h2>
              <p className="text-[10px] text-zinc-400 font-tech">
                Scout the junkyard, buy performance speed parts, get fresh tires, or flip cars to buyers
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playBack();
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Notice alert */}
        {purchaseNotice && (
          <div className="bg-emerald-900/40 border-b border-emerald-500/40 px-4 py-2 text-xs font-tech text-emerald-300 flex items-center gap-2 animate-fade-in">
            <Check size={14} className="text-emerald-400 shrink-0" />
            <span>{purchaseNotice}</span>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/80 p-1.5 gap-1.5 shrink-0 overflow-x-auto">
          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('junkyard');
            }}
            className={`flex-1 min-w-[110px] py-2 px-3 rounded-lg text-xs font-display uppercase font-bold transition-all cursor-pointer text-center ${
              activeTab === 'junkyard'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            1. The Junkyard
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('parts_store');
            }}
            className={`flex-1 min-w-[110px] py-2 px-3 rounded-lg text-xs font-display uppercase font-bold transition-all cursor-pointer text-center ${
              activeTab === 'parts_store'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            2. Speed Shop
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('tire_shop');
            }}
            className={`flex-1 min-w-[110px] py-2 px-3 rounded-lg text-xs font-display uppercase font-bold transition-all cursor-pointer text-center ${
              activeTab === 'tire_shop'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            3. Tire Store
          </button>

          <button
            onClick={() => {
              soundFx.playClick();
              setActiveTab('buyers');
            }}
            className={`flex-1 min-w-[110px] py-2 px-3 rounded-lg text-xs font-display uppercase font-bold transition-all cursor-pointer text-center ${
              activeTab === 'buyers'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            4. Car Buyers
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-4 flex-1 overflow-y-auto">
          {/* TAB 1: THE JUNKYARD */}
          {activeTab === 'junkyard' && (
            <div className="flex flex-col gap-3">
              <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800 text-xs text-zinc-300 font-tech">
                Scout the salvage yard for forgotten barn finds and project beaters. Towing a beater brings it to your garage jack stands!
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {JUNKYARD_BEATERS.map((beater) => (
                  <div
                    key={beater.id}
                    className="bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/40 rounded-xl p-3.5 flex flex-col justify-between transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold font-display uppercase text-white">
                          {beater.name}
                        </span>
                        <span className="text-xs font-bold text-amber-400 font-display">
                          ${beater.price.toLocaleString()}
                        </span>
                      </div>

                      <div className="text-[11px] font-tech text-amber-300/80 mb-2">
                        {beater.rustLevel} • {beater.salvageEngine}
                      </div>

                      <p className="text-[11px] text-zinc-400 font-tech">{beater.description}</p>
                    </div>

                    <button
                      onClick={() => {
                        if (cash < beater.price) {
                          soundFx.playBack();
                          notify('Insufficient funds to tow this vehicle!');
                          return;
                        }
                        soundFx.playCashChime();
                        onTowBeater(beater);
                        notify(`Towed ${beater.name} back to your garage workshop!`);
                      }}
                      className="mt-3 w-full py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-black font-bold font-display uppercase text-xs rounded-lg transition-all cursor-pointer"
                    >
                      TOW TO GARAGE (-${beater.price})
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: SPEED PARTS STORE */}
          {activeTab === 'parts_store' && (
            <div className="flex flex-col gap-3">
              <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800 text-xs text-zinc-300 font-tech">
                Brand new racing turbos, high-flow dual carb intakes, big brake packages, and track coilovers.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SPEED_STORE_ITEMS.map((item) => (
                  <div
                    key={item.id}
                    className="bg-zinc-900/90 border border-zinc-800 hover:border-cyan-500/40 rounded-xl p-3.5 flex flex-col justify-between transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold font-display uppercase text-white">
                          {item.name}
                        </span>
                        <span className="text-xs font-bold text-emerald-400 font-display">
                          ${item.price.toLocaleString()}
                        </span>
                      </div>

                      <div className="text-[11px] font-tech text-cyan-400 mb-1.5 font-bold">
                        {item.hpGain} • {item.category.toUpperCase()}
                      </div>

                      <p className="text-[11px] text-zinc-400 font-tech">{item.description}</p>
                    </div>

                    <button
                      onClick={() => {
                        if (cash < item.price) {
                          soundFx.playBack();
                          notify('Not enough cash in your bankroll!');
                          return;
                        }
                        soundFx.playCashChime();
                        onBuyPart(item);
                        notify(`Purchased ${item.name}! Added to your inventory.`);
                      }}
                      className="mt-3 w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold font-display uppercase text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <ShoppingCart size={13} />
                      BUY COMPONENT (-${item.price})
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TIRE STORE */}
          {activeTab === 'tire_shop' && (
            <div className="flex flex-col gap-3">
              <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800 text-xs text-zinc-300 font-tech">
                Tire compounds for drag strips, racetracks, and street cruising. Take them to your workshop tire machine!
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {TIRE_SHOP_ITEMS.map((tire) => (
                  <div
                    key={tire.id}
                    className="bg-zinc-900/90 border border-zinc-800 p-3.5 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-bold font-display text-white uppercase">{tire.name}</div>
                      <div className="text-xs text-amber-400 font-tech">{tire.gripRating}</div>
                      <p className="text-[11px] text-zinc-400 font-tech mt-0.5">{tire.description}</p>
                    </div>

                    <button
                      onClick={() => {
                        if (cash < tire.price) {
                          soundFx.playBack();
                          notify('Insufficient funds!');
                          return;
                        }
                        soundFx.playCashChime();
                        notify(`Bought set of ${tire.name}!`);
                      }}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-amber-400 font-display font-bold text-xs uppercase rounded-lg border border-amber-500/30 shrink-0 cursor-pointer"
                    >
                      ${tire.price}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: TWO CAR BUYERS */}
          {activeTab === 'buyers' && (
            <div className="flex flex-col gap-4">
              <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800 text-xs text-zinc-300 font-tech">
                Current Project Car Restoration Progress: <strong className="text-amber-400">{carCompletionPercent}%</strong>
              </div>

              {/* Buyer 1: Lower-Cost Budget Car Buyer */}
              <div className="bg-zinc-900/90 border border-zinc-700 rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold font-display uppercase text-zinc-200">
                      1. "Rusty Pete's" Budget Wholesale Lot
                    </span>
                    <span className="text-xs font-tech text-amber-400 uppercase bg-amber-500/10 px-2 py-0.5 rounded">
                      Low-Cost Buyer
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-tech">
                    Buys daily beaters, runners, and partially restored cars as-is for quick cash turnover. No high standards.
                  </p>
                  <div className="mt-2 text-sm font-bold font-display text-emerald-400">
                    Payout Offer: ~${Math.round(4500 + carCompletionPercent * 95)}
                  </div>
                </div>

                <button
                  onClick={() => {
                    soundFx.playCashChime();
                    onSellCar('budget');
                    notify('Sold car to Rusty Pete! Cash transferred to your bankroll.');
                  }}
                  className="mt-3 w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-zinc-100 font-bold font-display uppercase text-xs rounded-lg transition-all cursor-pointer"
                >
                  SELL TO BUDGET BUYER
                </button>
              </div>

              {/* Buyer 2: Premium Expensive Collector Consignment */}
              <div className="bg-gradient-to-br from-amber-950/40 via-zinc-900 to-black border-2 border-amber-500/50 rounded-xl p-4 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold font-display uppercase text-amber-300">
                      2. "Apex Classics" Collector & Auctioneer
                    </span>
                    <span className="text-xs font-tech text-yellow-300 uppercase bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40">
                      Premium High-End
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 font-tech">
                    Only buys 85%+ fully restored muscle cars with clean radiators, fresh tires, and running engines for top-dollar private collections.
                  </p>
                  <div className="mt-2 text-base font-bold font-display text-emerald-300">
                    Payout Offer: ~${Math.round(28000 + carCompletionPercent * 240)}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (carCompletionPercent < 80) {
                      soundFx.playBack();
                      notify('Collector rejected offer: Car must be at least 80% restored to meet elite standards!');
                      return;
                    }
                    soundFx.playCashChime();
                    onSellCar('elite');
                    notify('RECORD SALE! Sold to Apex Classics Collector for massive profit!');
                  }}
                  className={`mt-3 w-full py-2.5 font-black font-display uppercase text-xs rounded-lg transition-all cursor-pointer ${
                    carCompletionPercent >= 80
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-lg shadow-amber-500/25'
                      : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                  }`}
                >
                  {carCompletionPercent >= 80
                    ? 'SELL TO ELITE COLLECTOR'
                    : 'REQUIRES 80%+ RESTORATION FIRST'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
