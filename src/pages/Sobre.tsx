import { TreePine, Heart, Users, Target, Mail, MessageCircle } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

export default function Sobre() {
  return (
    <Layout>
      {/* Header */}
      <section className="bg-gradient-hero text-primary-foreground py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <TreePine className="h-16 w-16 mx-auto mb-6 opacity-90" />
            <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              Sobre o Portal Vista Alegre
            </h1>
            <p className="text-lg text-primary-foreground/85">
              Um projeto comunitário feito com carinho para conectar e fortalecer 
              os moradores do Vista Alegre do Abunã.
            </p>
          </div>
        </div>
      </section>

      <section className="container py-16">
        <div className="max-w-3xl mx-auto">
          {/* Mission */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <h2 className="font-heading text-2xl font-bold">Nossa Missão</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              O Portal Comunitário Vista Alegre nasceu da necessidade de criar um espaço 
              digital onde os moradores do distrito possam se manter informados, conectados 
              e participativos na vida da comunidade. Nosso objetivo é facilitar a comunicação, 
              divulgar os serviços locais e ajudar a resolver os problemas do bairro de forma 
              organizada e transparente.
            </p>
          </div>

          {/* What we offer */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Heart className="h-5 w-5 text-accent" />
              </div>
              <h2 className="font-heading text-2xl font-bold">O que oferecemos</h2>
            </div>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span><strong>Notícias e Comunicados:</strong> Informações atualizadas sobre eventos, obras e novidades da comunidade.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span><strong>Registro de Ocorrências:</strong> Canal para reportar problemas como iluminação, buracos e saneamento.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span><strong>Diretório de Comércios:</strong> Apoio aos negócios locais com visibilidade para mercados, oficinas e serviços.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span><strong>Contatos Úteis:</strong> Telefones de emergência, saúde, educação e serviços públicos.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span><strong>Reserva de Quadras:</strong> Sistema para agendamento das quadras esportivas da comunidade.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span><strong>Consulta de Encomendas:</strong> Verificação de pacotes no correio comunitário.</span>
              </li>
            </ul>
          </div>

          {/* Team */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-success" />
              </div>
              <h2 className="font-heading text-2xl font-bold">Quem mantém o projeto</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Este portal é mantido por voluntários da própria comunidade, com o apoio da 
              associação de moradores do Vista Alegre do Abunã. Nosso trabalho é totalmente 
              voluntário e sem fins lucrativos.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Se você quer ajudar, seja divulgando o portal, sugerindo melhorias ou se 
              voluntariando para a equipe, entre em contato conosco!
            </p>
          </div>

          {/* Contact */}
          <div className="bg-card rounded-2xl p-8 shadow-card">
            <h2 className="font-heading text-xl font-bold mb-4">Como ajudar ou entrar em contato</h2>
            <p className="text-muted-foreground mb-6">
              Sua participação é fundamental para o sucesso deste projeto. 
              Entre em contato para sugestões, dúvidas ou para se voluntariar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="https://wa.me/5569999999999"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="w-full sm:w-auto">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
              </a>
              <a href="mailto:contato@minhavistaalegre.com.br">
                <Button variant="outline" className="w-full sm:w-auto">
                  <Mail className="h-4 w-4 mr-2" />
                  contato@minhavistaalegre.com.br
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
