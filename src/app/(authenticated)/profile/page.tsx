"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UserCircle, Mail, Phone, MapPin, Globe, Shield, Activity, CalendarDays, Loader2, Save } from "lucide-react";
import { format } from "date-fns";

export default function ProfilePage() {
  const { user, updateProfile, isUpdateProfileLoading, logout } = useAuth();
  
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    country: "",
    city: "",
    street: "",
    preferred_currency: "PKR"
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        phone: user.phone || "",
        country: user.address?.country || "",
        city: user.address?.city || "",
        street: user.address?.street || "",
        preferred_currency: user.preferred_currency || "PKR",
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      full_name: formData.full_name,
      phone: formData.phone || null,
      address: {
        country: formData.country,
        city: formData.city,
        street: formData.street
      },
      preferred_currency: formData.preferred_currency
    });
  };

  if (!user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/20 backdrop-blur-md shadow-inner text-4xl font-bold uppercase text-white ring-4 ring-white/30">
            {user.full_name?.charAt(0) || user.email.charAt(0)}
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-extrabold tracking-tight">{user.full_name}</h1>
            <div className="mt-2 flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-medium text-indigo-100">
              <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" /> {user.email}</span>
              <span className="flex items-center gap-1.5 capitalize"><Shield className="h-4 w-4" /> {user.role}</span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" /> Joined {format(new Date(user.created_at), "MMM yyyy")}
              </span>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-24 -right-24 opacity-10 pointer-events-none">
          <UserCircle className="h-96 w-96" />
        </div>
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
        {/* Left Column - Form */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm border-gray-100">
            <CardHeader 
              title="Personal Information" 
              subtitle="Update your profile details and preferences."
            />
            <div className="px-6 pb-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <UserCircle className="h-4 w-4 text-gray-400" /> Full Name
                    </label>
                    <Input
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleChange}
                      placeholder="Jane Doe"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" /> Phone Number
                    </label>
                    <Input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+92 300 1234567"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-indigo-500" />
                    Residential Address
                  </h4>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-600">Street Address</label>
                      <Input
                        name="street"
                        value={formData.street}
                        onChange={handleChange}
                        placeholder="123 Main St"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-gray-600">City</label>
                      <Input
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Karachi"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="text-xs font-medium text-gray-600">Country</label>
                      <Input
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        placeholder="Pakistan"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-indigo-500" />
                    Preferences
                  </h4>
                  <div className="w-full sm:w-1/2 space-y-2">
                    <label className="text-xs font-medium text-gray-600">Default Currency</label>
                    <select
                      name="preferred_currency"
                      value={formData.preferred_currency}
                      onChange={handleChange}
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="PKR">PKR (Pakistani Rupee)</option>
                      <option value="USD">USD (US Dollar)</option>
                      <option value="EUR">EUR (Euro)</option>
                      <option value="GBP">GBP (British Pound)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-100">
                  <Button
                    type="submit"
                    disabled={isUpdateProfileLoading}
                    className="flex items-center gap-2 w-full sm:w-auto"
                  >
                    {isUpdateProfileLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Profile Changes
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>

        {/* Right Column - Status & Actions */}
        <div className="space-y-6">
          <Card className="shadow-sm border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <Activity className="h-5 w-5 text-indigo-600" />
              <h3 className="font-semibold text-gray-900">Account Status</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Email Verification</span>
                <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  Verified
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Active Status</span>
                <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  Active
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Account Role</span>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 capitalize ring-1 ring-inset ring-blue-600/20">
                  {user.role}
                </span>
              </div>
            </div>
          </Card>

          <Card className="shadow-sm border-rose-100 bg-rose-50/30">
            <div className="p-6 border-b border-rose-100/50">
               <h3 className="font-semibold text-gray-900">Session Management</h3>
               <p className="mt-1 text-sm text-gray-500">Log out on this device.</p>
            </div>
            <div className="px-6 py-4">
              <Button
                variant="outline"
                className="w-full text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                onClick={() => logout()}
              >
                Sign Out
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
