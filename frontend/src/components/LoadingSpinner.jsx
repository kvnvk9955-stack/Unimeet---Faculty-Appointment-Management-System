import React from "react";
import { Loader2 } from "lucide-react";

const LoadingSpinner = ({ className = "" }) =>
<div className={`flex items-center justify-center py-12 ${className}`}>
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>;


export default LoadingSpinner;