# React JS Landing Page Template

**

# 🛎️🛎️ Good news! New & improved [V2](https://github.com/issaafalkattan/react-landing-page-template-2021) is out  

**


### <a href="https://react-landing-page-template-93ne.vercel.app/">LIVE DEMO</a> 

## Description
This is a ReactJS based landing page template, fit for a startup company/service with a one page view. The design is inspired by a template from <a href="https://www.free-css.com/assets/files/free-css-templates/preview/page234/interact/">Free-CSS.com </a>
All 'visual' data can be easily modified by changing the data.json file.

## Make it Yours!
### 1. Preps
You will need to have <a href="https://nodejs.org/">Node JS</a> installed on your pc. 

### 2. Clone Files
After cloning the files, you will have to run ```yarn``` followed by ```yarn start``` in the CLI
### 3. Add your own data 
Change the data in the ```data.json``` file as well as add any images to ```public/img/```
You can also change styles by modifying the ```public/css``` files.
If you need the contact form to work, you also need to create an EmailJS account, and modify the ```src/components/contact.jsx``` file to replace your own service ID, template ID and Public Key

## Like this project?
<a href="https://www.buymeacoffee.com/issaaf">Buy my a coffee ☕️</a>

## Credits
##### Free CSS 
<a href="https://www.free-css.com/assets/files/free-css-templates/preview/page234/interact/">Free-CSS.com </a>

##### Issaaf kattan
# 55LAB — Site institucional

## Desenvolvimento

```bash
npm install
npm start
```

Módulo de editais: http://localhost:3000/editais (requer API em `localhost:8000` — ver [docs/BACKEND.md](docs/BACKEND.md)).

## Docker (local, HTTP)

```bash
docker compose up -d --build web
```

## Backend API — Licitação (Laravel + MySQL)

```bash
docker compose up -d mysql api queue
```

API em http://localhost:8000 — cadastro de editais, configuração de IA e análise assíncrona.

Documentação completa: [docs/BACKEND.md](docs/BACKEND.md)

## Produção (HTTPS + Certbot)

```bash
cp .env.example .env
# DOMAIN=55lab.com.br e CERTBOT_EMAIL=...

docker compose --profile production up -d --build
./scripts/init-ssl.sh
```

Guia: [docs/SSL.md](docs/SSL.md). Se aparecer *orphan certbot*, use `--profile production` ou `--remove-orphans`.

# 55lab (template original)
