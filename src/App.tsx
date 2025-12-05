import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import Index from "./pages/Index";
import Noticias from "./pages/Noticias";
import NoticiaDetalhe from "./pages/NoticiaDetalhe";
import Ocorrencias from "./pages/Ocorrencias";
import Comercios from "./pages/Comercios";
import CadastroComercio from "./pages/CadastroComercio";
import ContatosUteis from "./pages/ContatosUteis";
import Sobre from "./pages/Sobre";
import Quadras from "./pages/Quadras";
import Encomendas from "./pages/Encomendas";
import Comunidade from "./pages/Comunidade";

// Admin Pages
import AdminLogin from "./pages/admin/Login";
import AdminDashboard from "./pages/admin/Dashboard";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/noticias" element={<Noticias />} />
          <Route path="/noticias/:slug" element={<NoticiaDetalhe />} />
          <Route path="/ocorrencias" element={<Ocorrencias />} />
          <Route path="/comercios" element={<Comercios />} />
          <Route path="/cadastro-comercio" element={<CadastroComercio />} />
          <Route path="/contatos-uteis" element={<ContatosUteis />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/quadras" element={<Quadras />} />
          <Route path="/encomendas" element={<Encomendas />} />
          <Route path="/comunidade" element={<Comunidade />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
