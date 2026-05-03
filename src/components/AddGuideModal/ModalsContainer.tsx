import React from "react";
import {
  AlertModalForm,
  AnchorModalForm,
  BadgeModalForm,
  CTAModalForm,
  CalloutModalForm,
  CitationModalForm,
  CodeDiffModalForm,
  CodeModalForm,
  ComparisonModalForm,
  DefinitionModalForm,
  DetailsModalForm,
  FAQModalForm,
  FigureModalForm,
  FootnoteModalForm,
  KbdModalForm,
  KeyValueModalForm,
  LinkModalForm,
  QuoteModalForm,
  StepsModalForm,
  TableModalForm,
  TabsModalForm,
  TimelineModalForm,
  VersionModalForm,
  VideoModalForm,
  DownloadLinkModalForm,
  PlaygroundModalForm,
} from "../EditorToolForms";
import QuizBuilderModal from "../quiz/QuizBuilderModal";

interface ModalsContainerProps {
  insertText: (text: string) => void;
  // Modal visibility states
  showLinkModal: boolean; setShowLinkModal: (v: boolean) => void;
  showTableModal: boolean; setShowTableModal: (v: boolean) => void;
  showVideoModal: boolean; setShowVideoModal: (v: boolean) => void;
  showCalloutModal: boolean; setShowCalloutModal: (v: boolean) => void;
  showCodeModal: boolean; setShowCodeModal: (v: boolean) => void;
  showFigureModal: boolean; setShowFigureModal: (v: boolean) => void;
  showDetailsModal: boolean; setShowDetailsModal: (v: boolean) => void;
  showFootnoteModal: boolean; setShowFootnoteModal: (v: boolean) => void;
  showBadgeModal: boolean; setShowBadgeModal: (v: boolean) => void;
  showKbdModal: boolean; setShowKbdModal: (v: boolean) => void;
  showQuoteModal: boolean; setShowQuoteModal: (v: boolean) => void;
  showAnchorModal: boolean; setShowAnchorModal: (v: boolean) => void;
  showCitationModal: boolean; setShowCitationModal: (v: boolean) => void;
  showCTAModal: boolean; setShowCTAModal: (v: boolean) => void;
  showStepsModal: boolean; setShowStepsModal: (v: boolean) => void;
  showTimelineModal: boolean; setShowTimelineModal: (v: boolean) => void;
  showComparisonModal: boolean; setShowComparisonModal: (v: boolean) => void;
  showAlertModal: boolean; setShowAlertModal: (v: boolean) => void;
  showTabsModal: boolean; setShowTabsModal: (v: boolean) => void;
  showDefinitionModal: boolean; setShowDefinitionModal: (v: boolean) => void;
  showCodeDiffModal: boolean; setShowCodeDiffModal: (v: boolean) => void;
  showFAQModal: boolean; setShowFAQModal: (v: boolean) => void;
  showVersionModal: boolean; setShowVersionModal: (v: boolean) => void;
  showKeyValueModal: boolean; setShowKeyValueModal: (v: boolean) => void;
  showPlaygroundModal: boolean; setShowPlaygroundModal: (v: boolean) => void;
  showDownloadLinkModal: boolean; setShowDownloadLinkModal: (v: boolean) => void;
  showQuizBuilder: boolean; setShowQuizBuilder: (v: boolean) => void;
}

export const ModalsContainer: React.FC<ModalsContainerProps> = (props) => {
  const { insertText } = props;

  return (
    <>
      {props.showLinkModal && (
        <LinkModalForm 
          onInsert={(text, url) => {
            insertText(`[${text}](${url})`);
            props.setShowLinkModal(false);
          }} 
          onClose={() => props.setShowLinkModal(false)} 
        />
      )}
      {props.showTableModal && (
        <TableModalForm 
          onInsert={(rows, cols) => {
            let table = "\n| " + Array(cols).fill("Header").join(" | ") + " |\n";
            table += "| " + Array(cols).fill("---").join(" | ") + " |\n";
            for (let i = 0; i < rows; i++) {
              table += "| " + Array(cols).fill("Cell").join(" | ") + " |\n";
            }
            insertText(table);
            props.setShowTableModal(false);
          }} 
          onClose={() => props.setShowTableModal(false)} 
        />
      )}
      {props.showVideoModal && (
        <VideoModalForm 
          onInsert={(embedCode) => {
            insertText(embedCode);
            props.setShowVideoModal(false);
          }} 
          onClose={() => props.setShowVideoModal(false)} 
        />
      )}
      {props.showCalloutModal && (
        <CalloutModalForm 
          onInsert={(type, message) => {
            insertText(`\n:::callout{type="${type}"}\n${message}\n:::\n`);
            props.setShowCalloutModal(false);
          }} 
          onClose={() => props.setShowCalloutModal(false)} 
        />
      )}
      {props.showCodeModal && (
        <CodeModalForm 
          onInsert={(code, language) => {
            insertText(`\n\`\`\`${language}\n${code}\n\`\`\`\n`);
            props.setShowCodeModal(false);
          }} 
          onClose={() => props.setShowCodeModal(false)} 
        />
      )}
      {props.showFigureModal && (
        <FigureModalForm 
          onInsert={(url, caption) => {
            insertText(`\n<figure>\n  <img src="${url}" alt="${caption}">\n  <figcaption>${caption}</figcaption>\n</figure>\n`);
            props.setShowFigureModal(false);
          }} 
          onClose={() => props.setShowFigureModal(false)} 
        />
      )}
      {props.showDetailsModal && (
        <DetailsModalForm 
          onInsert={(summary, content) => {
            insertText(`\n<details>\n<summary>${summary}</summary>\n\n${content}\n</details>\n`);
            props.setShowDetailsModal(false);
          }} 
          onClose={() => props.setShowDetailsModal(false)} 
        />
      )}
      {props.showFootnoteModal && (
        <FootnoteModalForm 
          onInsert={(marker, _definition) => {
            insertText(`[^${marker}]`);
            // Definition would usually go at the end, but we just insert the marker for now
            props.setShowFootnoteModal(false);
          }} 
          onClose={() => props.setShowFootnoteModal(false)} 
        />
      )}
      {props.showBadgeModal && (
        <BadgeModalForm 
          onInsert={(text) => {
            insertText(` <span class="badge">${text}</span> `);
            props.setShowBadgeModal(false);
          }} 
          onClose={() => props.setShowBadgeModal(false)} 
        />
      )}
      {props.showKbdModal && (
        <KbdModalForm 
          onInsert={(keys) => {
            insertText(keys.map(k => `<kbd>${k}</kbd>`).join("+"));
            props.setShowKbdModal(false);
          }} 
          onClose={() => props.setShowKbdModal(false)} 
        />
      )}
      {props.showQuoteModal && (
        <QuoteModalForm 
          onInsert={(quote, author) => {
            insertText(`\n> ${quote}\n${author ? `> — ${author}\n` : ""}`);
            props.setShowQuoteModal(false);
          }} 
          onClose={() => props.setShowQuoteModal(false)} 
        />
      )}
      {props.showAnchorModal && (
        <AnchorModalForm 
          defaultSlug=""
          onInsert={(id) => {
            insertText(`<a id="${id}"></a>`);
            props.setShowAnchorModal(false);
          }} 
          onClose={() => props.setShowAnchorModal(false)} 
        />
      )}
      {props.showCitationModal && (
        <CitationModalForm 
          onInsert={(citation, sourceUrl) => {
            insertText(` [^${citation}]${sourceUrl ? `(${sourceUrl})` : ""} `);
            props.setShowCitationModal(false);
          }} 
          onClose={() => props.setShowCitationModal(false)} 
        />
      )}
      {props.showCTAModal && (
        <CTAModalForm 
          onInsert={(label, url) => {
            insertText(`\n:::cta\n[${label}](${url})\n:::\n`);
            props.setShowCTAModal(false);
          }} 
          onClose={() => props.setShowCTAModal(false)} 
        />
      )}
      {props.showStepsModal && <StepsModalForm onInsert={(c) => { insertText(c); props.setShowStepsModal(false); }} onClose={() => props.setShowStepsModal(false)} />}
      {props.showTimelineModal && <TimelineModalForm onInsert={(c) => { insertText(c); props.setShowTimelineModal(false); }} onClose={() => props.setShowTimelineModal(false)} />}
      {props.showComparisonModal && <ComparisonModalForm onInsert={(c) => { insertText(c); props.setShowComparisonModal(false); }} onClose={() => props.setShowComparisonModal(false)} />}
      {props.showAlertModal && <AlertModalForm onInsert={(c) => { insertText(c); props.setShowAlertModal(false); }} onClose={() => props.setShowAlertModal(false)} />}
      {props.showTabsModal && <TabsModalForm onInsert={(c) => { insertText(c); props.setShowTabsModal(false); }} onClose={() => props.setShowTabsModal(false)} />}
      {props.showDefinitionModal && <DefinitionModalForm onInsert={(c) => { insertText(c); props.setShowDefinitionModal(false); }} onClose={() => props.setShowDefinitionModal(false)} />}
      {props.showCodeDiffModal && <CodeDiffModalForm onInsert={(c) => { insertText(c); props.setShowCodeDiffModal(false); }} onClose={() => props.setShowCodeDiffModal(false)} />}
      {props.showFAQModal && <FAQModalForm onInsert={(c) => { insertText(c); props.setShowFAQModal(false); }} onClose={() => props.setShowFAQModal(false)} />}
      {props.showVersionModal && <VersionModalForm onInsert={(c) => { insertText(c); props.setShowVersionModal(false); }} onClose={() => props.setShowVersionModal(false)} />}
      {props.showKeyValueModal && <KeyValueModalForm onInsert={(c) => { insertText(c); props.setShowKeyValueModal(false); }} onClose={() => props.setShowKeyValueModal(false)} />}
      {props.showPlaygroundModal && <PlaygroundModalForm onInsert={(c) => { insertText(c); props.setShowPlaygroundModal(false); }} onClose={() => props.setShowPlaygroundModal(false)} />}
      {props.showDownloadLinkModal && <DownloadLinkModalForm onInsert={(c) => { insertText(c); props.setShowDownloadLinkModal(false); }} onClose={() => props.setShowDownloadLinkModal(false)} />}
      
      {props.showQuizBuilder && (
        <QuizBuilderModal
          onClose={() => props.setShowQuizBuilder(false)}
          onInsert={(quizData: Record<string, any>) => {
            const quizBlock = `\n\`\`\`quiz\n${JSON.stringify(quizData, null, 2)}\n\`\`\`\n`;
            insertText(quizBlock);
            props.setShowQuizBuilder(false);
          }}
        />
      )}
    </>
  );
};
